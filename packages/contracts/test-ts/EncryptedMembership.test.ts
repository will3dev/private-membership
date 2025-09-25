import { ethers } from "ethers";
import { expect, beforeAll, beforeEach, describe, it } from "vitest";
import EncryptedMembershipArtifact from "../out/EncryptedMembership.sol/EncryptedMembership.json" with { type: "json" }
import EncryptedLoyaltyPointArtifact from "../out/EncryptedLoyaltyPoints.sol/EncryptedLoyaltyPoints.json" with { type: "json" }
import NewMembershipVerifierArtifact from "../out/NewMembershipVerifier.sol/Groth16Verifier.json" with { type: "json" }
import { generateMembershipHash, getPrivateKeyFromSignature, formatKeyForCurve, signWithBJJPoseidon, generateNewMembershipInput } from "../../sdk/src";
import { Base8, mulPointEscalar, subOrder } from "@zk-kit/baby-jubjub";
import { createWalletClient, http, keccak256, stringToHex, concatHex } from "viem";
import { mainnet } from "viem/chains";


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
    let provider: ethers.JsonRpcProvider;
    let owner: any;

    beforeAll(async function () {
         // Connect to Anvil (will need to make sure anvil node is running)
        provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

        // Use Anvil's second account (has 10k ETH) to avoid nonce conflicts
        const privateKey = await provider.getSigner();
        owner = privateKey
        
        // Airdrop ETH to the test account (100 ETH = 0x56bc75e2d630e00000)
        await provider.send("anvil_setBalance", [owner.address, "0x56bc75e2d630e00000"]);


        // Deployment for newMembershipVerifier
        const newMembershipVerifierFactory = new ethers.ContractFactory(
            NewMembershipVerifierArtifact.abi,
            NewMembershipVerifierArtifact.bytecode,
            owner
        )

        const newMembershipContract = await newMembershipVerifierFactory.deploy({
            gasLimit: 5000000 // 5M gas limit
        });

        await newMembershipContract.waitForDeployment();

        // TO DO: add deployment for MembershipVerifier


        // Set up to deploy the membership contract
        const membershipFactory = new ethers.ContractFactory(
            EncryptedMembershipArtifact.abi,
            EncryptedMembershipArtifact.bytecode,
            owner
        );

        // Deploy membership contract
        membershipContract = await membershipFactory.deploy(
            newMembershipContract.getAddress(),
            "0x0000000000000000000000000000000000000000", // placeholder for membershipVerifier
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
        
    })

})