import { Point, MembershipHash } from "../../sdk/src";
import { Wallet, Signer, HDNodeWallet } from "ethers";

export type NewMemberAdded = {
    leafHash: string;
    poseidonLeafHash: bigint;
    publicKey: [
        bigint,
        bigint
    ];
};

export type MembershipElements = {
    SignedSecretId: string;
    SignerSeed: string;
}


export type User = {
   nonFormattedPrivKey: string;
   formattedKey: bigint;
   pubKey: Point;
   signer: Signer;
   membershipElements: MembershipElements;
   hashDetails: MembershipHash;
}

export type MerkleProof = {
    leafPosition: bigint;
    merkleProof: string[];
    merkleRoot: string;
}