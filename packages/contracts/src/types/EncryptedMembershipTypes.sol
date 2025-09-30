pragma solidity ^0.8.0;


// Points balance management elements
struct Point {
    uint256 x;
    uint256 y;
}

struct EGCT {
    Point c1;
    Point c2;
}

struct PointsBalance {
    uint256[7] balancePCT; // the user balance represented as a poseidon ciphertext
    EGCT eGCT; // the user's encrypted balance represented as an El Gamal ciphertext
    uint256 nonce; // the nonce for the user's balance
}

// ZKP Elements
struct ProofPoints {
    uint256[2] a;
    uint256[2][2] b;
    uint256[2] c;
}

struct NewMembershipProof {
    ProofPoints proofPoints;
    uint256[3] publicSignals;
}

struct MembershipProof {
    ProofPoints proofPoints;
    uint256[3] publicSignals; // TODO: Update after compiling the circuit
}

struct ClaimPoints {
    ProofPoints proofPoints;
    uint256[] publicSignals; // TODO: Update after compiling the circuit
}

struct ProvePointsBalance {
    ProofPoints proofPoints;
    uint256[] publicSignals; // TODO: Update after compiling the circuit
}

// Merkle Proof Elements
struct MerkleProof {
    uint256 leafPosition;
    bytes32[] merkleProof;
    bytes32 merkleRoot;
}