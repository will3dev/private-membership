declare module 'blake-hash' {
    interface BlakeHash {
        update(data: Buffer | string): BlakeHash;
        digest(): Buffer;
    }

    function createBlakeHash(algorithm: string): BlakeHash;
    export = createBlakeHash;
}