pragma circom 2.1.9;

include "../circomlib/circuits/poseidon.circom";
include "./components.circom";


/**
This circuit will be used to prove new membership for users join the dApp.

The user will need to prove the following elements:

- poseidon hash is well formed 
- public key is well formed from private key
- starting eGCT is 0 
- starting PCT is 0

*/ 


// TO DO: Modify circuit to support setting an initial points amount



template NewMembershipCircuit () {
    signal input SenderPrivateKey;
    signal input SenderPublicKey[2];
    
    signal input MembershipNullifier;
    signal input MembershipTrapdoor;
    signal input MembershipSecretId;

    signal input MembershipHash;
    signal input NullifierHash;

    signal input StartingPtsC1[2];
    signal input StartingPtsC2[2];

    signal input StartingPtsPCT[4];
    signal input StartingPtsAuthKey[2];
    signal input StartingPtsNonce;
    signal input StartingPtsRandom;

    // Verify that the transfer amount is less than or equal to the sender's balance and is less than the base order
    var baseOrder = 2736030358979909402780800718157159386076813972158567259200215660948447373041;  
    
    // Verify that the sender's public key is well-formed
    component checkSenderPK = CheckPublicKey();
    checkSenderPK.privKey <== SenderPrivateKey;
    checkSenderPK.pubKey[0] <== SenderPublicKey[0];
    checkSenderPK.pubKey[1] <== SenderPublicKey[1];

    // Compute the public key from private key to constrain it
    component computeSenderPK = BabyPbk();
    computeSenderPK.in <== SenderPrivateKey;
    
    // Constrain the computed public key to match the input public key
    computeSenderPK.Ax === SenderPublicKey[0];
    computeSenderPK.Ay === SenderPublicKey[1];

    // Verify that the nullifer hash is well-formed
    component checkNullifierHash = CheckMembershipNullifierHash();
    checkNullifierHash.nullifier <== MembershipNullifier;
    checkNullifierHash.trapdoor <== MembershipTrapdoor;
    checkNullifierHash.nullifierHash <== NullifierHash;

    // Verify that the Membership hash is well-formed
    component checkMembershipHash = CheckMembershipHash();
    checkMembershipHash.secretId <== MembershipSecretId;
    checkMembershipHash.nullifierHash <== NullifierHash;
    checkMembershipHash.membershipHash <== MembershipHash;

    // Compute the membership hash to constrain it
    component computeMembershipHash = Poseidon(2);
    computeMembershipHash.inputs[0] <== MembershipSecretId;
    computeMembershipHash.inputs[1] <== NullifierHash;
    
    // Constrain the computed membership hash to match the input
    computeMembershipHash.out === MembershipHash;

    // The default amount that is used for starting the user's loyalty point balance
    var startingAmount = 2;

    // Verify that the encrypted starting amount is the starting amount
    component checkStartingPts = CheckValue();
    checkStartingPts.value <== startingAmount;
    checkStartingPts.privKey <== SenderPrivateKey;
    checkStartingPts.valueC1[0] <== StartingPtsC1[0];
    checkStartingPts.valueC1[1] <== StartingPtsC1[1];
    checkStartingPts.valueC2[0] <== StartingPtsC2[0];
    checkStartingPts.valueC2[1] <== StartingPtsC2[1];

    // Verify that the PCT starting amount is the starting amount
    component checkStartingPCT = CheckPCT();
    checkStartingPCT.publicKey[0] <== SenderPublicKey[0];
    checkStartingPCT.publicKey[1] <== SenderPublicKey[1];
    checkStartingPCT.pct <== StartingPtsPCT;
    checkStartingPCT.authKey[0] <== StartingPtsAuthKey[0];
    checkStartingPCT.authKey[1] <== StartingPtsAuthKey[1];
    checkStartingPCT.nonce <== StartingPtsNonce;
    checkStartingPCT.random <== StartingPtsRandom;
    checkStartingPCT.value <== startingAmount;

}

component main { public[ 
    SenderPublicKey, //0-1
    MembershipHash, //2
    StartingPtsC1, // 3-4
    StartingPtsC2, // 5-6
    StartingPtsPCT, // 7-10
    StartingPtsAuthKey, // 11-12
    StartingPtsNonce // 13
]} = NewMembershipCircuit();


