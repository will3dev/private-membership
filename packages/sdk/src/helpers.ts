import { Base8, type Point, mulPointEscalar } from "@zk-kit/baby-jubjub";
import {
	formatPrivKeyForBabyJub,
	genRandomBabyJubValue,
	poseidonDecrypt,
	poseidonEncrypt,
} from "maci-crypto";
import { buildPoseidon, eddsa } from "circomlibjs";
import { randomBytes } from "node:crypto";
import { keccak256 } from "ethers";
import { BN254_SCALAR_FIELD, BASE_POINT_ORDER } from "./constants";
import { poseidon } from "maci-crypto/build/ts/hashing";
import { BJJPoseidonSignature } from "./types/helper_types";
import { MembershipHash } from "./types"
import { writeFileSync } from "node:fs";
import { join } from "path";

/**
 * Used to generate a poseidon hash of a set of input values
 * @param inputs 
 * @returns poseidon hash value
 */
export async function poseidonHash(
    inputs: bigint[]
): Promise<bigint> {
    for (let i = 0; i < inputs.length; i++) {
        if (inputs[i] >= BN254_SCALAR_FIELD) {
            throw new Error("Input exceeds field size")
        }
    }
    const poseidon = await buildPoseidon();

    const res = poseidon.F.toObject(poseidon(inputs));
    return res
}

/**
 * Useed to convert a string to a valid bigInt to use in poseidon hash over BN254 scalar field
 * @param inputs the string to be converted
 * @returns the bigint value
 */
export async function toField (
    input: string
): Promise<bigint> {
    // convert the input values to bytes
    const bytes = Buffer.from(input, 'utf8');

    // perform keccak256 hash of input values
    const hash = keccak256(bytes);

    // convert the keccak256 value to a bigint 
    const hashAsBigInt = BigInt(hash);

    // mod p the bigint value
    return hashAsBigInt % BN254_SCALAR_FIELD
}


export async function scalarToEdDSASeed(sk: bigint): Promise<Uint8Array> {
    const x = ((sk % BASE_POINT_ORDER) + BASE_POINT_ORDER) % BASE_POINT_ORDER; // in [0, r-1]
    if (x === 0n) throw new Error("Invalid BJJ scalar: zero"); // zero is not allowed scalar
    const hex = x.toString(16).padStart(64, "0"); // 32 bytes
    return await eddsa.pruneBuffer(Buffer.from(hex, "hex"))
}


export async function signWithBJJPoseidon(
    sk: bigint,
    messageFields: bigint[]
): Promise<BJJPoseidonSignature> {
    const seed = await scalarToEdDSASeed(sk);
    const poseidon = await buildPoseidon();
    const m = await poseidon.F.toObject(poseidon(messageFields));

    const sig = await eddsa.signPoseidon(seed, m);
    const pub = await eddsa.prv2pub(seed);

    return {
        pk1: pub[0], pk2: pub[1],
        R8x: sig.R8[0], R8y: sig.R8[1],
        S: BigInt(sig.S),
        packed: eddsa.packSignature(sig)
    }
}


/**
 * Generates a membership hash that will be used when becoming a member 
 * @param seed this is modified and included with the membership hash
 * @param secretId secret message encrypted with pubKey of user 
 * @param 
 */
export async function generateMembershipHash (
    seed: string,
    secretIdSeed: string
): Promise<MembershipHash> {

    // create nullifer and trapdoor, then hash together 
    const nullifier = await toField(keccak256(Buffer.from(seed + "nullifier", "utf8")));
    const trapdoor = await toField(keccak256(Buffer.from(seed + "trapdoor", "utf8")));
    const hashOfIdentifiers = await poseidonHash([nullifier, trapdoor]);

    const formattedSecretId = await toField(keccak256(Buffer.from(secretIdSeed, 'utf8')))

    // take the secretId that was signed by the user in previous step and hash with the identifiers
    const output = await poseidonHash([formattedSecretId, hashOfIdentifiers])
    return {
        hash: output,
        nullifier: nullifier,
        trapdoor: trapdoor,
        identifiersHash: hashOfIdentifiers,
        secretId: formattedSecretId,
    }
}

//TO DO: 
// Add function for generating BJJ sk and pk. Can look at what is done in eERC. Take this method an apply it to generating the secret Id used in the hash.


export async function generateNewMembershipInput(
    senderPrivateKey: bigint,
    senderPublicKey: [bigint, bigint],
    membershipHash: bigint,
    nullifierHash: bigint,
    membershipNullifier: bigint,
    membershipTrapdoor: bigint,
    membershipSecretId: bigint
) {
    const input = {
        SenderPrivateKey: senderPrivateKey.toString(),
        SenderPublicKey: senderPublicKey.map(key => key.toString()),
        MembershipHash: membershipHash.toString(),
        NullifierHash: nullifierHash.toString(),
        MembershipNullifier: membershipNullifier.toString(),
        MembershipTrapdoor: membershipTrapdoor.toString(),
        MembershipSecretId: membershipSecretId.toString()
      };

    const inputPath = join(__dirname, '../../circuits/inputs/input_newMembership.json');
    writeFileSync(inputPath, JSON.stringify(input, null, 2));
  
    return input;
}


