pragma solidity ^0.8.0;









struct MerkleProof {
    uint256 leafPosition;
    bytes32[] merkleProof;
    bytes32 merkleRoot;
}