import { groth16 } from "snarkjs";

export type FormattedMembershipProof = {
    proofPoints: {
        a: [bigint, bigint];
        b: [[bigint, bigint], [bigint, bigint]];
        c: [bigint, bigint];
    };
    publicSignals: [bigint, bigint, bigint];
};

// TODO: Will need to modify this so that there is a new proof generation for the newMembershipProof
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
    const pubSignals = argv[3].map((x: string) => BigInt(x)) as [bigint, bigint, bigint];

    const newMembershipProof: FormattedMembershipProof = {
        proofPoints: {
            a: a,
            b: b,
            c: c
        },
        publicSignals: pubSignals
    }

    return newMembershipProof;
}