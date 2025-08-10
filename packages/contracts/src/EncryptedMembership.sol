pragma solidity ^0.8.0;

import { AppendMerkleTree } from "./merkleTrees/AppendMerkleTree.sol";
import { MerkleProof } from "./types/EncryptedMembershipTypes.sol";


contract EncryptedMembership is AppendMerkleTree {

    constructor() {
        _initializeMerkleTree();
    }

    /**
     * @dev This function is used to become a member of the encrypted membership.
     * @param leaf The leaf to add to the merkle tree.
     */
    function becomeMember(bytes32 leaf) public {
        // add the leaf to the merkle tree
        _addLeaf(leaf);
    }

    /**
     * @dev This function is used to prove membership of a leaf in the merkle tree.
     * @param membershipProof The membership proof to validate. This is a ZKP that a user must pass showing that they are able to properly form the leaf hash.
     * @param merkleProof The merkle proof to validate.
     * @return isMember a boolean value indicating if the provided user is a member.
     * This function would be used to act as a gatecheck when validating a user. It would be used as a helper function for external operations such as claiming points.
     */
    function proveMembership(uint256[] calldata membershipProof, MerkleProof calldata merkleProof) public view returns (bool isMember) {
        // validate teh membershipProof
    }


    function getAllMembershipCommitments() public view returns (bytes32[] memory membershipCommitments) {
        return leaves;
    }






}