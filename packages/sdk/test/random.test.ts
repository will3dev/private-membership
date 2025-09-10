/// <reference types="vitest" />
import {
    getPrivateKeyFromSignature,
    formatKeyForCurve,
    grindKey,
    signWithBJJPoseidon,
    generateNewMembershipInput
} from "../src"
import { expect, describe, it } from "vitest";
import { processPoseidonEncryption, processPoseidonDecryption } from "../src/poseidon";
import { formatPrivKeyForBabyJub, genPrivKey, hash2 } from "maci-crypto";
import { Base8, mulPointEscalar, subOrder } from "@zk-kit/baby-jubjub";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http, keccak256, stringToHex, concatHex } from "viem";
import { mainnet } from "viem/chains";
import { generateMembershipHash } from "../src"


// I want to generate some example code for generating certain values to make sure they work


// 1. generate a random private key
// Could potentially generate values using MACI crypto that then validate using own functions
describe("Key Derivation", () => {
    it("should generate a private key from a signature", () => {
        const signature = "0x21fbf0696d5e0aa2ef41a2b4ffb623bcaf070461d61cf7251c74161f82fec3a43" +
        "70854bc0a34b3ab487c1bc021cd318c734c51ae29374f2beb0e6f2dd49b4bf41c";

        const privateKey = getPrivateKeyFromSignature(signature);
        expect(privateKey).toEqual("91ca6a724408ee9b5dc7330702ebb8339f7b95c5041a546b2241bce05b640d");
    })

    it("should format properly", () => {
        const cases = [
            {
                key: "2afa023647c36b81ec17fc65a40e7128e3b35f73160b0e6af556e56462d8e9f6",
                expected:
                  562819399746207251456275138853779458015718802238235240199147763678013522260n,
              },
              {
                key: "a35108aab8124f9d9b1e7bd189b9597b8b395ae08fb32e699ffadc6393c38dd",
                expected:
                  2251360863138910982837482474475732139690137621654118073641459798203325289282n,
              }
        ];

        for (const { key, expected } of cases) {
            const formattedKey = formatKeyForCurve(key);
            expect(formattedKey).toEqual(expected);
        }
    })
})

// 2. EG encryption over a set of values


// 3. Posiedon encryption & decryption over a set of values
describe("Poseidon Encryption and Decryption", () => {
    it("should encrypt and decrypt properly", () => {
        const privateKey = genPrivKey();
        const formattedPrivKey = formatPrivKeyForBabyJub(privateKey);
        const publicKey = mulPointEscalar(Base8, formattedPrivKey).map(x => BigInt(x));

        const input = 10n;

        const { ciphertext, nonce, encRandom, poseidonEncryptionKey, authKey } = processPoseidonEncryption([input], publicKey);

        const decrypted = processPoseidonDecryption(ciphertext, authKey, nonce, privateKey, 1);

        expect(decrypted).toEqual([input]);
    })
})


// 4. Generate membership proof
describe("Generate the data for a private membership proof", () => {
    let user;
    let wallet;

    it("Should derive new key for user and user should sign registration message.", async () => {
        // generate ecdsa private key and "wallet" for user.
        const ecdsaKey = generatePrivateKey();
        user = privateKeyToAccount(ecdsaKey);
        wallet = createWalletClient({ chain:mainnet, transport: http() });
        

        // derive bjj key pair for user
        const bjjMessage = "PrivateMembershipPoints: BJJ Key seed\n" +
        `addr:${user.address}\nchaindId:0000\nsalt:PMP/v1/BJJ-key`;
        const bjjSeed = await wallet.signMessage({ account: user, message: bjjMessage });

        console.log("Seed for BJJ Seed:", bjjSeed);

        const nonFormattedKey = getPrivateKeyFromSignature(bjjSeed);
        const formattedKey = formatKeyForCurve(nonFormattedKey);
        const publicKey = mulPointEscalar(Base8, formattedKey);

        console.log("NON-FORMATTED KEY:", nonFormattedKey);
        console.log("FORMATTED KEY:", formattedKey);
        console.log("PUBLIC KEY:", publicKey);

        // generate secret ID for user which is a value derived from standard message
        const sIdMessage = "PrivateMembershipPoints: sId\n" +
        `addr:${user.address}\nchaindId:0000\nsalt:PMP/v1/SID`;
        const sIdSeed = await wallet.signMessage({ account: user, message: sIdMessage });

        console.log("SECRET ID SEED:", sIdSeed);
        

        // generate seed for nullifier and trapdoor from signature 
        const ntMessage = "PrivateMembershipPoints: dervice nullifier and trapdoor seed\n" +
        `addr:${user.address}\nchaindId:0000\nsalt:PMP/v1/trapdoor-nullifer`;
        const ntSeed = await wallet.signMessage({ account: user, message: ntMessage });

        console.log("Seed for Nullifier and Trapdoor:", ntSeed);

        // generate membership hash. which is poseidon(secretId, poseidon(nullifier, trapdoor))
        const membershipHash = await generateMembershipHash(ntSeed, sIdSeed);
        console.log("Membership Hash:", membershipHash.hash);
        console.log("Nullifier:", membershipHash.nullifier);
        console.log("Trapdoor:", membershipHash.trapdoor);
        console.log("Identifiers Hash:", membershipHash.identifiersHash);
        console.log("SecretID:", membershipHash.secretId);


        generateNewMembershipInput(
            formattedKey,
            [BigInt(publicKey[0]), BigInt(publicKey[1])],
            membershipHash.hash,
            membershipHash.identifiersHash,
            membershipHash.nullifier,
            membershipHash.trapdoor,
            membershipHash.secretId
        )


        // sign membership hash using eddsa over BJJ
        //const eddsaSignature = signWithBJJPoseidon(formattedKey, [membershipHash.hash]);
        //console.log(eddsaSignature);
    })

})

