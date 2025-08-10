pragma solidity ^0.8.0;

/**
 * @title IndexedMerkleTree
 * @dev This contract is an abstract contract that provides the functionality to create a merkle tree.
 * It is designed to be used as a base contract for other merkle tree contracts.
 * This contract is designed to be used when the leaves are indexed at a specific position and may be updated.
 */
abstract contract IndexedMerkleTree {
    
    bytes32[] internal leaves;
    uint256 internal leafCount;
    mapping(bytes32 leaf => bool) internal leafLookup;
    mapping(bytes32 leaf => uint256 leafPosition) internal leafPositionLookup;
    mapping(bytes32 merkleRoot => bool isValidRoot) internal merkleRootLookup;
    
    error LeafExists();
    error RootDoesNotExist();
    error LeafDoesNotExist();

    constructor() {
        _initializeMerkleTree();
    }

    /**
     * @dev This function is called when the merkle tree is initialized.
     * It is used to initialize the merkle tree with the first leaf.
     */
    function _initializeMerkleTree() internal virtual {
        merkleRootLookup[bytes32(0)] = true;
        leafCount = 0;
    }
    
    /**
     * @dev This function is called before a leaf is added to the merkle tree.
     * It is used to perform any necessary checks before adding a leaf.
     */
    function _beforeAddLeaf(bytes32 leaf) internal virtual {}

    /**
     * @dev This function is called after a leaf is added to the merkle tree.
     * It is used to perform any necessary checks after adding a leaf.
     */
    function _afterAddLeaf(bytes32 leaf) internal virtual {}

    /**
     * @dev This function is used to add a leaf to the merkle tree.
     * @param leaf The leaf to add to the merkle tree.
     */
    function _addLeaf(bytes32 leaf) internal virtual {
        _beforeAddLeaf(leaf);
        
        if (leafLookup[leaf]) {
            revert LeafExists();
        }

        leaves.push(leaf);

        // add the leaf to the lookup, marking it as a valid leaf
        leafLookup[leaf] = true;

        // add the leaf's position to the position lookup
        leafPositionLookup[leaf] = leafCount;
        leafCount++;

        _calculateNewMerkleRoot();

        _afterAddLeaf(leaf);
    }

    /**
     * @dev This function is used to update a leaf in the merkle tree.
     * @param leafPosition The position of the leaf to update.
     * @param currentLeaf The current leaf value.
     * @param newLeaf The new leaf value.
     */
    function _updateLeaf(uint256 leafPosition, bytes32 currentLeaf, bytes32 newLeaf) internal virtual {
        if (leafPosition >= leafCount) {
            revert LeafDoesNotExist();
        }

        // check to see if the current leaf exists
        if (!leafLookup[currentLeaf]) {
            revert LeafDoesNotExist();
        }

        // check to see if the leafPosition being updated matches the currentLeaf
        if (leaves[leafPosition] != currentLeaf) {
            revert LeafDoesNotExist();
        }
        
        // if the current leaf is the same as the new leaf, then we don't need to do anything
        if (currentLeaf == newLeaf) {
            return;
        }

        // invalidate the current leaf value 
        leafLookup[currentLeaf] = false;

        // invalidate the position for currentLeaf
        leafPositionLookup[currentLeaf] = 0;

        // set the position in the leaves array to match the newLeaf
        leaves[leafPosition] = newLeaf;

        // set the newLeaf position in the mapping to the leafPosition
        leafPositionLookup[newLeaf] = leafPosition;

        // calculate the new merkle root
        _calculateNewMerkleRoot();

        // after the update, we need to recalculate the merkle root
        _afterUpdateLeaf(leafPosition, currentLeaf, newLeaf);
    }

    /**
     * @dev This function is used to calculate the new merkle root.
     * Should only be called internally when new leaves are added.
     * It will calculate a new valid root and add into root history.
     */
    function _calculateNewMerkleRoot() internal {
        /*
            if there are no leaves then merkleRoot is 0

            if there is one leaf than merkleRoot is the leaf

            from here we need to calculate the merkle root by determining the number of leaves
            The number if the number of leaves is even then we need to hash the leaves in pairs and then add the result to new array
            If the number of leaves is odd, when you get to the last leaf, you hash it with itself and then add the result to the array.
            
            This process will continue until there is only one hash left in the array.

            Then the final hash is set as the merkle root.
        */
        if (leafCount == 0) {
            merkleRootLookup[bytes32(0)] = true;
            return;
        } 

        if (leafCount == 1) {
            merkleRootLookup[leaves[0]] = true;
            return;
        }

        bytes32[] memory newLeaves = leaves; // 3

        while (newLeaves.length > 1) {
            bytes32[] memory level = new bytes32[]((newLeaves.length + 1) / 2); // add the 1 to ensure that this is sized correctly. 2

            for (uint256 i = 0; i < newLeaves.length; i+=2) {
                if (i + 1 < newLeaves.length) {
                    level[i/2] = keccak256(abi.encodePacked(newLeaves[i], newLeaves[i+1]));
                } else {
                    level[i/2] = keccak256(abi.encodePacked(newLeaves[i], newLeaves[i])); // hash the odd value with itself
                }
                
            } 

            newLeaves = level;
        }

        merkleRootLookup[newLeaves[0]] = true;

    }

    /**
     * @dev This function is used to validate a merkle proof for a given leaf position.
     * @param leafPosition The position of the leaf to validate the proof for.
     * @param merkleproof The merkle proof to validate. This must be a valid merkle proof otherwise this will revert.
     * @param providedMerkleRoot The merkle root to validate the proof against.
     * @return True if the proof is valid, false otherwise.
     */
    function _validateProof(uint256 leafPosition, bytes32[] calldata merkleproof, bytes32 providedMerkleRoot) internal view returns (bool) {
        // check to see if the leaf position is within the bounds of the leaves array
        require(leafPosition < leaves.length, "Leaf position out of bounds");
        // check to see if the provided merkle root is valid
        if (!merkleRootLookup[providedMerkleRoot]) {
            revert RootDoesNotExist();
        }

        // get the leaf that we are validating
        bytes32 leaf = leaves[leafPosition];

        // check to see if the leaf exists
        if (!leafLookup[leaf]) {
            revert LeafDoesNotExist();
        }

        // this is a pointer to the value that will need to be hashed as sibling leaves are calculated
        bytes32 hashValueToCombine = leaf;

        // this tracks the index of the hashValueToCombine so that we can later determine its position in the tree
        uint256 currentIndex = leafPosition;
        
        for (uint256 i = 0; i < merkleproof.length; i++) {
            bytes32 proofElement = merkleproof[i];
            
            // if true then the value is even, else odd. 
            // this changes the order of the hash 
            if (currentIndex & 1 == 0) {
                hashValueToCombine = keccak256(abi.encodePacked(hashValueToCombine, proofElement));
            } else {
                hashValueToCombine = keccak256(abi.encodePacked(proofElement, hashValueToCombine));
            }

            // move the next level up to the sibling index.abi
            // >>= 1 performs integer division by two more efficiently
            currentIndex >>= 1;
        }
        
        // After the while loop, the hashValueToCombine should be calculated Merkle root
        // if the hashValueToCombine is the same as the providedMerkleRoot, which we already have checked to be valid, 
        // then the proof is valid
        return providedMerkleRoot == hashValueToCombine;
    }

    /**
     * @dev This function is used to get the leaves of the merkle tree.
     */
    function getLeaves() public view returns (bytes32[] memory) {
        return leaves;
    }

    /**
     * @dev This function is used to get the number of leaves in the merkle tree.
     */
    function getLeafCount() public view returns (uint256) {
        return leafCount;
    }

    /**
     * @dev This function is used to check if a merkle root is valid. This is helpful 
     * when validating proofs that are provided by a third party.
     * @param merkleRoot The merkle root to check.
     * @return True if the merkle root is valid, false otherwise.
     */
    function isValidRoot(bytes32 merkleRoot) public view returns (bool) {
        return merkleRootLookup[merkleRoot];
    }

    function _getProofHeight() internal view returns (uint256) {
        if (leafCount == 0) return 0;
        if (leafCount == 1) return 0;
        
        uint256 height = 0;
        uint256 currentCount = leafCount;

        while (currentCount > 1) {
            currentCount = (currentCount + 1) >> 1; // Ceiling division
            height++;
        }

        return height;
    }
