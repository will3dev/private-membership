import { groth16 } from "snarkjs";
import { processPoseidonDecryption, processPoseidonEncryption } from "../../sdk/src/poseidon";
import { encryptMessage, decryptPoint } from "../../sdk/src/jub";
import { Point, ElGamalCipherText } from "../../sdk/src/types";
import { expect } from "chai";

export type FormattedNewMembershipProof = {
    proofPoints: {
        a: [bigint, bigint];
        b: [[bigint, bigint], [bigint, bigint]];
        c: [bigint, bigint];
    };
    publicSignals: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
};

export type FormattedMembershipProof = {
    proofPoints: {
        a: [bigint, bigint];
        b: [[bigint, bigint], [bigint, bigint]];
        c: [bigint, bigint];
    };
    publicSignals: [bigint, bigint, bigint];
};


/**
 * Function for decrypting a PCT
 * @param privateKey
 * @param pct PCT to be decrypted
 * @param length Length of the original input array
 * @returns decrypted - Decrypted message as an array
 */
export const decryptPCT = async (
	privateKey: bigint,
	pct: bigint[],
	length = 1,
) => {
	// extract the ciphertext, authKey, and nonce from the pct
	const ciphertext = pct.slice(0, 4);
	const authKey = pct.slice(4, 6);
	const nonce = pct[6];

	const decrypted = processPoseidonDecryption(
		ciphertext,
		authKey,
		nonce,
		privateKey,
		length,
	);

	return decrypted;
};


export async function generateMembershipProof(
    senderPrivateKey: bigint,
    senderPublicKey: [bigint, bigint],
    membershipHash: bigint,
    nullifierHash: bigint,
    membershipNullifier: bigint,
    membershipTrapdoor: bigint,
    membershipSecretId: bigint
): Promise<FormattedMembershipProof> {
    const input = {
        SenderPrivateKey: senderPrivateKey.toString(),
        SenderPublicKey: senderPublicKey.map(key => key.toString()),
        MembershipHash: membershipHash.toString(),
        NullifierHash: nullifierHash.toString(),
        MembershipNullifier: membershipNullifier.toString(),
        MembershipTrapdoor: membershipTrapdoor.toString(),
        MembershipSecretId: membershipSecretId.toString()
    };

    const {
        proof,
        publicSignals
    } = await groth16.fullProve(
        input,
        "../circuits/membership/proveMembership_js/proveMembership.wasm",
        "../circuits/membership/proveMembership_final.zkey"
    );

    const raw = await groth16.exportSolidityCallData(proof, publicSignals);

    const argv = JSON.parse("[" + raw + "]");

    const a: [bigint, bigint] = [BigInt(argv[0][0]), BigInt(argv[0][1])];
    const b: [[bigint, bigint], [bigint, bigint]] = [
    [BigInt(argv[1][0][0]), BigInt(argv[1][0][1])],
    [BigInt(argv[1][1][0]), BigInt(argv[1][1][1])],
    ];
    const c: [bigint, bigint] = [BigInt(argv[2][0]), BigInt(argv[2][1])];
    const pubSignals = argv[3].map((x: string) => BigInt(x)) as [bigint, bigint, bigint];

    const membershipProof: FormattedMembershipProof = {
        proofPoints: {
            a: a,
            b: b,
            c: c
        },
        publicSignals: pubSignals
    }

    return membershipProof;
}


// TODO: add components for handling EG and PCT encryption
export async function generateNewMembershipProof(
    senderPrivateKey: bigint,
    senderPublicKey: [bigint, bigint],
    membershipHash: bigint,
    nullifierHash: bigint,
    membershipNullifier: bigint,
    membershipTrapdoor: bigint,
    membershipSecretId: bigint
): Promise<FormattedNewMembershipProof> {
    
    const startingValue = BigInt(2);

    const {
        ciphertext,
        nonce,
        encRandom,
        poseidonEncryptionKey, 
        authKey
    } = processPoseidonEncryption(
        [startingValue],
        senderPublicKey
    );

    const startingPointsEGCT = encryptMessage(
        senderPublicKey,
        startingValue
    );

    
    const input = {
        SenderPrivateKey: senderPrivateKey.toString(),
        SenderPublicKey: senderPublicKey.map(key => key.toString()),
        MembershipHash: membershipHash.toString(),
        NullifierHash: nullifierHash.toString(),
        MembershipNullifier: membershipNullifier.toString(),
        MembershipTrapdoor: membershipTrapdoor.toString(),
        MembershipSecretId: membershipSecretId.toString(),
        StartingPtsC1: startingPointsEGCT.cipher[0],
        StartingPtsC2: startingPointsEGCT.cipher[1],
        StartingPtsPCT: ciphertext,
        StartingPtsAuthKey: authKey,
        StartingPtsNonce: nonce,
        StartingPtsRandom: encRandom,
    };

    const {
        proof,
        publicSignals
    } = await groth16.fullProve(
        input,
        "../circuits/newMembership/newMembership_js/newMembership.wasm",
        "../circuits/newMembership/newMembership_final.zkey"
    );

    const raw = await groth16.exportSolidityCallData(proof, publicSignals);

    const argv = JSON.parse("[" + raw + "]");

    const a: [bigint, bigint] = [BigInt(argv[0][0]), BigInt(argv[0][1])];
    const b: [[bigint, bigint], [bigint, bigint]] = [
    [BigInt(argv[1][0][0]), BigInt(argv[1][0][1])],
    [BigInt(argv[1][1][0]), BigInt(argv[1][1][1])],
    ];
    const c: [bigint, bigint] = [BigInt(argv[2][0]), BigInt(argv[2][1])];
    const pubSignals = argv[3].map((x: string) => BigInt(x)) as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];

    const newMembershipProof: FormattedNewMembershipProof = {
        proofPoints: {
            a: a,
            b: b,
            c: c
        },
        publicSignals: pubSignals
    }

    return newMembershipProof;
}


export async function decryptedBalance(
    privateKey: bigint,
    balanceEGCT: bigint[][],
    balancePCT: bigint[]
): Promise<bigint> {
    // 1. decrypt the EGCT point
    const decryptedEGCT = await decryptPoint(
        privateKey,
        balanceEGCT[0],
        balanceEGCT[1]
    );

    // 2. decrypt the PCT balance
    const decryptedPCT = await decryptPCT(
        privateKey,
        balancePCT
    );

    // 3. confirm these two values are the same
    expect(decryptedEGCT[0]).equal(decryptedPCT[0]);

    // 4. return the decrypted value
    return decryptedPCT[0];
}