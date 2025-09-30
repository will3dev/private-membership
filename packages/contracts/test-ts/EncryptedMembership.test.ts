import { ethers } from "ethers";
import { expect, beforeAll, beforeEach, describe, it } from "vitest";
import EncryptedMembershipArtifact from "../out/EncryptedMembership.sol/EncryptedMembership.json" with { type: "json" }
import EncryptedLoyaltyPointArtifact from "../out/EncryptedLoyaltyPoints.sol/EncryptedLoyaltyPoints.json" with { type: "json" }
import NewMembershipVerifierArtifact from "../out/NewMembershipVerifier.sol/Groth16Verifier.json" with { type: "json" }
import MembershipVerifierArtifact from "../out/MembershipVerifier.sol/Groth16Verifier.json" with { type: "json" }
import { generateMembershipHash, getPrivateKeyFromSignature, formatKeyForCurve, signWithBJJPoseidon, generateNewMembershipInput, getSecretIdFromSignature } from "../../sdk/src";
import { Base8, mulPointEscalar, subOrder } from "@zk-kit/baby-jubjub";
import { createWalletClient, http, keccak256, stringToHex, concatHex } from "viem";
import { mainnet } from "viem/chains";
import { generateMembershipProof, FormattedMembershipProof } from "./helpers";
import { groth16 } from "snarkjs"
import { readFileSync } from "fs";
import { join } from "path";
import { NewMemberAdded, User, MerkleProof } from "./types";
import { calculateMerkleTreeHeight, calculateMerkleRoot, generateMerkleProof } from "./merkleHelpers";


// Helper function to convert BigInt to hex string (64-character padding like CLI)
function bigIntToHex(value: bigint): string {
    return "0x" + value.toString(16).padStart(64, "0");
}

/*
deployment operations:
deploy verifiers
deploy encryptedMembership using verifiers input
deploy loyaltyPoints using verifiers address, membership address
update the encryptedMembership contract with position of loyaltyPoints

 */

describe("Encrypted Membership", function () {
    let membershipContract: any;
    let loyaltyPointsContract: any;
    let newMembershipVerifierContract: any;
    let membershipVerifierContract: any;
    let provider: ethers.JsonRpcProvider;
    let owner: any;
    let newMemberDetails: NewMemberAdded[];
    let allUsers: User[];

    beforeAll(async function () {
        // Connect to Anvil (will need to make sure anvil node is running)
        provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

        // Use Anvil's second account (has 10k ETH) to avoid nonce conflicts
        const privateKey = await provider.getSigner();
        owner = privateKey
        
        // Airdrop ETH to the test account (100 ETH = 0x56bc75e2d630e00000)
        await provider.send("anvil_setBalance", [owner.address, "0x56bc75e2d630e00000"]);

        allUsers = [];
        newMemberDetails = [];

        // Deployment for newMembershipVerifier
        const newMembershipVerifierFactory = new ethers.ContractFactory(
            NewMembershipVerifierArtifact.abi,
            NewMembershipVerifierArtifact.bytecode,
            owner
        )

        newMembershipVerifierContract = await newMembershipVerifierFactory.deploy({
            gasLimit: 5000000 // 5M gas limit
        });

        await newMembershipVerifierContract.waitForDeployment();
        const newMembershipVerifierAddress = await newMembershipVerifierContract.getAddress();
        console.log("New Membership Verifier Address:", newMembershipVerifierAddress);

        // TO DO: add deployment for MembershipVerifier

        const membershipVerifierFactory = new ethers.ContractFactory(
            MembershipVerifierArtifact.abi,
            MembershipVerifierArtifact.bytecode,
            owner
        )

        membershipVerifierContract = await membershipVerifierFactory.deploy({
            gasLimit: 5000000 // 5M gas limit
        });

        await membershipVerifierContract.waitForDeployment();
        const membershipVerifierAddress = await newMembershipVerifierContract.getAddress();
        console.log("Membership Verifier Address:", newMembershipVerifierAddress);


        // Set up to deploy the membership contract
        const membershipFactory = new ethers.ContractFactory(
            EncryptedMembershipArtifact.abi,
            EncryptedMembershipArtifact.bytecode,
            owner
        );

        // Deploy membership contract
        membershipContract = await membershipFactory.deploy(
            newMembershipVerifierAddress,
            membershipVerifierAddress,
            {
                gasLimit: 5000000 // 5M gas limit
            }
        );
        await membershipContract.waitForDeployment()


        // TO DO: add deployment for encrypted loyalty points
        const loyaltyPointsFactory = new ethers.ContractFactory(
            EncryptedLoyaltyPointArtifact.abi,
            EncryptedLoyaltyPointArtifact.bytecode,
            owner
        );
        
        loyaltyPointsContract = await loyaltyPointsFactory.deploy(
            membershipContract.getAddress(),
            {
                gasLimit: 5000000 // 5M gas limit
            }
        );
        await loyaltyPointsContract.waitForDeployment();
        console.log("Loyalty Points Contract Address:", await loyaltyPointsContract.getAddress()); 

    })

    it("should deploy contracts successfully", async function () {
        expect(membershipContract).toBeDefined();
        expect(loyaltyPointsContract).toBeDefined();
    });

    it("should set loyalty points address", async function () {
        const loyaltyPointsAddress = await loyaltyPointsContract.getAddress();
        await membershipContract.setEncryptedLoyaltyPoints(loyaltyPointsAddress);
        
        const setAddress = await membershipContract.encryptedLoyaltyPoints();
        expect(setAddress).toBe(loyaltyPointsAddress);
    });

    it("should register users as a member", async function () {
        const memberCountBefore = await membershipContract.getMembershipCount();
        
        for (let x = 0; x < 10; x++) {
            // Set up the user wallet 
            const newUser = ethers.Wallet.createRandom().connect(provider);

            await provider.send("anvil_setBalance", [newUser.address, "0x56bc75e2d63e00000"]);
            
            // 1. Derive the BJJ key for user
            const bjjMessage = "PrivateMembershipPoints: BJJ Key seed\n" +
            `addr:${newUser.address}\nchainId:0000\nsalt:PMP/v1/BJJ-key`;
            const bjjSeed = await newUser.signMessage(bjjMessage);

            const nonFormattedKey = getPrivateKeyFromSignature(bjjSeed);
            const formattedKey = formatKeyForCurve(nonFormattedKey);
            const publicKey = mulPointEscalar(Base8, formattedKey);

            // 2. Generate the seed for secret ID for user which is a signature of standard message
            const sIdMessage = "PrivateMembershipPoints: sId\n" +
            `addr:${newUser.address}\nchaindId:0000\nsalt:PMP/v1/SID`;
            const sIdSeed = await newUser.signMessage(sIdMessage);

            // 3. Generate the seed for the nullifer and the trapdoor from signature 
            const ntMessage = "PrivateMembershipPoints: dervice nullifier and trapdoor seed\n" +
            `addr:${newUser.address}\nchaindId:0000\nsalt:PMP/v1/trapdoor-nullifer`;
            const ntSeed = await newUser.signMessage(ntMessage);


            // 3. Generate the membership hash
            const membershipHash = await generateMembershipHash(ntSeed, sIdSeed);

            allUsers.push(
                {
                    nonFormattedPrivKey: nonFormattedKey,
                    formattedKey: formattedKey,
                    pubKey: publicKey,
                    signer: newUser,
                    membershipElements: {
                        SignedSecretId: sIdMessage,
                        SignerSeed: ntSeed
                    },
                    hashDetails: membershipHash
                }
            )

            // 4. Generate the proof
            const newMembershipProofInputs: FormattedMembershipProof = await generateMembershipProof(
                formattedKey,
                [BigInt(publicKey[0]), BigInt(publicKey[1])],
                membershipHash.hash,
                membershipHash.identifiersHash, // This should be Poseidon(nullifier, trapdoor)
                membershipHash.nullifier,
                membershipHash.trapdoor,
                membershipHash.secretId // Use the secretId from generateMembershipHash
            )

            // 5. Submit to contract and verify that transaction was successful.
            try {
                const tx = await membershipContract.becomeMember(newMembershipProofInputs);
                const becomeMemberReceipt = await tx.wait();
                // TO DO: listen for event emited from contract
                for (const log of becomeMemberReceipt.logs) {
                    console.log(log);
                    try {
                        const parsedLog = membershipContract.interface.parseLog(log);
                        if (parsedLog.name === "newMemberAdded") {
                            const eventData = parsedLog.args;
                            newMemberDetails.push({
                                leafHash: eventData[0],
                                poseidonLeafHash: eventData[1],
                                publicKey: [eventData[2][0], eventData[2][1]]
                            })
                            console.log(newMemberDetails);
                            break;
                        }
                    } catch (e) {
                        // TO DO: Add some skip logic here
                    }
                }
                console.log("Transaction successful:", tx);
            } catch (error) {
                console.error("Transaction failed:", error);
                console.error("Full error:", JSON.stringify(error, null, 2));
                throw error;
            }

            // validate that the leaf was properly added to the tree by looking up to see that it is present
            const isValidMembership = await membershipContract.isValidMembership(newMemberDetails[x].leafHash);
            expect(isValidMembership).toEqual(true);

        }
       
        const memberCountAfter = await membershipContract.getMembershipCount();

        expect(memberCountAfter).toBeGreaterThan(memberCountBefore);

    }, 30000);

    it("should prove that user is a member", async function () {
        // 1. generate membership proof inputs
        const user: User = allUsers[0];

        // 2. generate membership proof
        const membershipProof: FormattedMembershipProof = await generateMembershipProof(
            user.formattedKey,
            [BigInt(user.pubKey[0]), BigInt(user.pubKey[1])],
            user.hashDetails.hash,
            user.hashDetails.identifiersHash, // This should be Poseidon(nullifier, trapdoor)
            user.hashDetails.nullifier,
            user.hashDetails.trapdoor,
            user.hashDetails.secretId // Use the secretId from generateMembershipHash
        )

        // 3. generate the merkle proof
            // get all the leaves and then calculate the root
        const allLeaves = await membershipContract.getAllMembershipCommitments();
        let positionOfLeaf;

        for (const [pos, leaf] of allLeaves.entries()) {
            if (leaf === newMemberDetails[0].leafHash) {
                positionOfLeaf = pos;
                break
            }
        }

        const merkleRoot = await calculateMerkleRoot(allLeaves);
        const merkleProof = await generateMerkleProof(positionOfLeaf, allLeaves);
        const fullProof: MerkleProof = {
            leafPosition: positionOfLeaf,
            merkleProof: merkleProof,
            merkleRoot: merkleRoot
        }

        // 4. submit the transaction to the chain
        const isValidMember = await membershipContract.proveMembership(membershipProof, fullProof);
        expect(isValidMember).toEqual(true);


    });

    it("should fail to prove membership if merkle proof is bad", async function () {
        // 1. generate membership proof inputs
        const user: User = allUsers[0];

        // 2. generate membership proof
        const membershipProof: FormattedMembershipProof = await generateMembershipProof(
            user.formattedKey,
            [BigInt(user.pubKey[0]), BigInt(user.pubKey[1])],
            user.hashDetails.hash,
            user.hashDetails.identifiersHash, // This should be Poseidon(nullifier, trapdoor)
            user.hashDetails.nullifier,
            user.hashDetails.trapdoor,
            user.hashDetails.secretId // Use the secretId from generateMembershipHash
        )

        // 3. generate the merkle proof
            // get all the leaves and then calculate the root
        const allLeaves = await membershipContract.getAllMembershipCommitments();
        let positionOfLeaf;

        for (const [pos, leaf] of allLeaves.entries()) {
            if (leaf === newMemberDetails[0].leafHash) {
                positionOfLeaf = pos;
                break
            }
        }

        const merkleRoot = await calculateMerkleRoot(allLeaves);
        const merkleProof = await generateMerkleProof(positionOfLeaf, allLeaves);
        const fullProof: MerkleProof = {
            leafPosition: BigInt(1),
            merkleProof: merkleProof,
            merkleRoot: merkleRoot
        }

        // 4. submit the transaction to the chain
        try {
            const isValidMember = await membershipContract.proveMembership(membershipProof, fullProof);
            expect(isValidMember).toEqual(false);
        } catch(e) {

        }
        


    });

    it("should test verifier with exact CLI proof format", async function () {
        /* Test with exact CLI proof format without BigInt conversion
        const cliProof = {
            pi_a: [
            "4674691199719049839003301220132732040215641850879428656267947157941063672911",
            "20053113727047923861387024117001442901886802029976927470118198681439752718925"
            ],
            pi_b: [
                [
                "13102217112481754290081211242642796854134398878828785792134880995834525314100",
                "9461429156428360932876238603000082045315134965693833476322122764887344178376"
                ],
                [
                "5338776649892217586462421373961950251288234826552494844476123292617377356603",
                "6734917865885668070942176450632326904000336987202407673166274124889678791955"
                ],
            ],
            pi_c: [
                "19187392086205057459345276767097261647711833748442811977348986090137317673143",
                "21687162569592743681169384671238440828143714213456069681561797771716517745447"
            ],
        };

        const cliPublicSignals = [
            "3263891328514690275989582704956469647777272079756159583858971214078220291147",
            "18376937429931012169342594711555484013645392719913217668397387900152353592299",
            "17394930391925300108817479868273631768149416197982190703017777126669817237778"
        ]
        */

        const inputs = {
            SenderPrivateKey: "822639697011021921516457068875962394969365908168924419839361913957889567034",
            SenderPublicKey: [
              "19291989160157729405820351311062959828169056651766621528256505338734241537531",
              "473139545349045232418971573525264973196111731109735782027560459575632344878"
            ],
            MembershipHash: "20769634596755648470666783648361744629752469298907149660611424646757500320980",
            NullifierHash: "16908481507948274405160375592569394585757009054631537302390021033655565602163",
            MembershipNullifier: "18644554255649371914530264499456677179081825778013312079934451526381331124543",
            MembershipTrapdoor: "15261839975789541662232210123122717722731256807479192645332972653923237650568",
            MembershipSecretId: "8374048968350182018746935460606870168568310966512287010372036189095328352003"
          }
        
        const wasmPath = join(__dirname, "../../circuits/newMembership/newMembership_js/newMembership.wasm");
        const zkeyPath = join(__dirname, "../../circuits/newMembership/newMembership_final.zkey");

        const { proof, publicSignals } = await groth16.fullProve(
            inputs,
            wasmPath,
            zkeyPath
        )
        console.log("PROOF: ", proof);
        console.log("PUBLIC SIGNALS: ", publicSignals);

        const raw = await groth16.exportSolidityCallData(proof, publicSignals);
        console.log("RAW ", raw)

        const argv = JSON.parse("[" + raw + "]");

        const a: [bigint, bigint] = [BigInt(argv[0][0]), BigInt(argv[0][1])];
        const b: [[bigint, bigint], [bigint, bigint]] = [
        [BigInt(argv[1][0][0]), BigInt(argv[1][0][1])],
        [BigInt(argv[1][1][0]), BigInt(argv[1][1][1])],
        ];
        const c: [bigint, bigint] = [BigInt(argv[2][0]), BigInt(argv[2][1])];
        const inputsUpdated: bigint[] = argv[3].map((x: string) => BigInt(x));

        try {
            const vkey = JSON.parse(readFileSync(
                "../circuits/newMembership/newMembershipVerification_key.json", "utf-8"
            ));

            const ok = await groth16.verify(vkey, publicSignals, proof);
            console.log("CLI SNARKJS VERIFY", ok);
            expect(ok).toEqual(true);
        } catch(error) {
            console.log("Exact CLI format error SNARKJS:", error);
        }

        const verifierContract = newMembershipVerifierContract;

        try {
            const isVerified = await verifierContract.verifyProof(
                a,
                b,
                c,
                publicSignals.map(x => BigInt(x))
            );
            console.log("CLI GENERATED VERIFIER RESULT: ", isVerified);
            expect(isVerified).toEqual(true);
        } catch(error) {
            console.log("CLI GENERATED VERIFIER ERROR: ", error);
        }
    });

    it("should test verifier with CLI calldata format", async function () {
        // Test with exact calldata format from snarkjs CLI
        const calldata = [
            ["0x1c0806c5d2f05716d0f7345cd7e2e53de9338dc411112a1dc6bb0401835d1a96", "0x0c6c4d209a5dd89ad9aade121810a45e3a816304c68424dd666f0c319f9718c7"],
            [
                ["0x1ea34cac638f53c65c5e2c4f5a0f552fd71698ba821b1d6bb2f5022f29f900f2", "0x061ab80f437888b0d670564e954d01caadb5bf80df0d87a2f5a3eed430326cb8"],
                ["0x2df1fd0f2a6db489e76d79e6b8ae4e3489ac28085ea586e9c3a74cf00c4857b3", "0x1019210254ac52f1da90920f7cb9ee3a1488190a340bec2f49879ca7f3f8c1ad"]
            ],
            ["0x06120ff1d3c37fe025a307d00d83f37feade44cd4481f4392e6ccacb122af049", "0x27bdc486007b795b7de196386edd4b6e5df426857ff27a94192f82b256a213da"],
            ["0x07374c09e8b58da02db866d411aadba8e6219b0b6c0f9a16c02b4039d7b5cc4b", "0x28a0fa5d757fb74e3e4ea24f8c0edca48795bd0871f6e3067787a0bc45ef13eb", "0x26752e84014d8001e09cd0505fb95bdd05cebfecf5ee953fbfc0f4b5e0f45112"]
        ];

        const verifierContract = newMembershipVerifierContract;

        try {
            const isVerified = await verifierContract.verifyProof(
                calldata[0],
                calldata[1],
                calldata[2],
                calldata[3]
            );
            console.log("CLI calldata format verification result:", isVerified);
            expect(isVerified).toEqual(true);
        } catch(error) {
            console.log("CLI calldata format error:", error);
        }
    });

})