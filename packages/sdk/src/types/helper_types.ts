export type EdDSAPublicKey = [bigint, bigint];
export type EdDSASignature = {
    R8: [bigint, bigint];
    S: bigint;
};

export type BJJPoseidonSignature = {
    pk1: bigint,
    pk2: bigint,
    R8x: bigint,
    R8y: bigint,
    S: bigint,
    packed: Uint8Array;
}


