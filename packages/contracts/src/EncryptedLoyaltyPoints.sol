pragma solidity ^0.8.0;

import { IndexedMerkleTree } from "./merkleTrees/IndexedMerkleTree.sol";
import { IEncryptedMembership } from "./interfaces/IEncryptedMembership.sol";
import { PointsBalance, ClaimPoints, ProvePointsBalance, MerkleProof } from "./types/EncryptedMembershipTypes.sol";

contract EncryptedLoyaltyPoints is IndexedMerkleTree {

    
    ///////////////////////////////////////////////////
    ///               State Variables               ///
    ///////////////////////////////////////////////////
    

    IEncryptedMembership public immutable membershipRegistry;
    mapping(bytes32 leaf => PointsBalance pointsBalance) internal pointsBalanceLookup;   

    ///////////////////////////////////////////////////
    ///                   Modifiers                 ///
    ///////////////////////////////////////////////////

    modifier onlyMembershipRegistry() {
        if (msg.sender != address(membershipRegistry)) {
            revert NotMembershipRegistry();
        }
        _;
    }

    ///////////////////////////////////////////////////
    ///                   Errors                    ///
    ///////////////////////////////////////////////////
    
    error NotMembershipRegistry();


    constructor(address _membershipRegistry) {
        _initializeMerkleTree();
        membershipRegistry = IEncryptedMembership(_membershipRegistry);
    }


    ///////////////////////////////////////////////////
    ///                   Functions                  ///
    ///////////////////////////////////////////////////

    // TODO: UPDATE FUNCTIONS TO USE MEMBERSHIP REGISTRY MODIFIER
    
    /**
     * @dev This function is used to add a new points balance for 
     * a newly registered user that is being added to the registry.
     * @param leaf The leaf of the user that is being added.
     * @param balance The points balance of the user that is being added.
     * @notice this is only to be used when adding a user for the first time
     */
    function addNewPointsBalance(bytes32 leaf, PointsBalance calldata balance) public onlyMembershipRegistry {
        // TODO: Add indexing process, need to add checks that current balance is zero
        
        pointsBalanceLookup[leaf] = balance;
        _addLeaf(leaf);
    }

    /**
     * @dev This function is used to claim points for a user that is a member of the registry.
     * @param currentLeaf The leaf of the user that is being claimed.
     * @param newLeaf The new leaf of the user that is being claimed.
     * @param _claimPoints The claim points to be claimed.
     * @param merkleProof The merkle proof of the user that is being claimed.
     */
    function claimNewPoints(bytes32 currentLeaf, bytes32 newLeaf, ClaimPoints calldata _claimPoints, MerkleProof calldata merkleProof) public {
        
        // Perform initial checks on input values
        if (leafLookup[currentLeaf] == false) {
            revert LeafDoesNotExist();
        }

        if (merkleProof.leafPosition > leafCount) {
            revert InvalidLeafPosition();
        }

        if (leafLookup[newLeaf] == true) {
            revert LeafExists();
        }
        
        uint256 leafPosition = leafPositionLookup[currentLeaf];
        if (leafPosition != merkleProof.leafPosition) {
            revert InvalidLeafPosition();
        }

        // TO DO: check that the ZKP is valid

        // TO DO: Check to see if the current point balance is zero, 
        // if so replace the current value with the eGCT and PCT from this proof

        // check that the merkleProof is valid
        _validateProof(leafPosition, merkleProof.merkleProof, merkleProof.merkleRoot);


        // update the leave value
        _updateLeaf(leafPosition, currentLeaf, newLeaf);
    }

     /**
     * @dev This function is used to get the points balance for a user that is a member of the registry.
     */
    function getPointsBalance(bytes32 leaf) public view returns(PointsBalance memory balance) {
        return pointsBalanceLookup[leaf];
    } 

    function provePointsBalance(bytes32 leaf, ProvePointsBalance memory _provePointsBalance) public {}
    
}