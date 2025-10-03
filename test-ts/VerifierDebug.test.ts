import { ethers } from "ethers";
import { expect, beforeAll, describe, it } from "vitest";
import NewMembershipVerifierArtifact from "../out/NewMembershipVerifier.sol/Groth16Verifier.json" with { type: "json" };

describe("Verifier Debug Test", function () {
    let verifierContract: any;
    let provider: ethers.JsonRpcProvider;
    let owner: any;

    beforeAll(async function () {
        provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
        const privateKey = await provider.getSigner();
        owner = privateKey;
        
        await provider.send("anvil_setBalance", [owner.address, "0x56bc75e2d630e00000"]);

        const verifierFactory = new ethers.ContractFactory(
            NewMembershipVerifierArtifact.abi,
            NewMembershipVerifierArtifact.bytecode,
            owner
        );

        verifierContract = await verifierFactory.deploy({
            gasLimit: 5000000
        });

        await verifierContract.waitForDeployment();
        console.log("Verifier Contract Address:", await verifierContract.getAddress());
    });

    it("should verify CLI proof with string inputs", async function () {
        const cliProof = {
            pi_a: [
                "10659168922133535108941299773816046807016626530129353669092766022696001072363",
                "11312819100873997810050969372748115686998995583518000086014834118336558143648"
            ],
            pi_b: [
                [
                    "1422757499669082423362186222583466843556607365321327214899723231451908354132",
                    "14993935769818257805853844882248693064834582322895323927771917737697342897890"
                ],
                [
                    "12140767016374648604246204461524323439853081121019320414014164044392797124070",
                    "19370480984471627845507940342950708680718169076514297179507072645307807327751"
                ]
            ],
            pi_c: [
                "11072258446674272962559800389042110346830471975668711910878397567783291113385",
                "9824589335918580963680640539618430914368698608281181048990036886348123589255"
            ]
        };

        const cliPublicSignals = [
            "3263891328514690275989582704956469647777272079756159583858971214078220291147",
            "18376937429931012169342594711555484013645392719913217668397387900152353592299",
            "17394930391925300108817479868273631768149416197982190703017777126669817237778"
        ];

        console.log("Testing with string inputs:");
        console.log("Proof A:", cliProof.pi_a);
        console.log("Proof B:", cliProof.pi_b);
        console.log("Proof C:", cliProof.pi_c);
        console.log("Public Signals:", cliPublicSignals);

        try {
            const result = await verifierContract.verifyProof(
                cliProof.pi_a,
                cliProof.pi_b,
                cliProof.pi_c,
                cliPublicSignals
            );
            console.log("String verification result:", result);
            expect(result).toBe(true);
        } catch (error) {
            console.error("String verification failed:", error);
            throw error;
        }
    });

    it("should verify CLI proof with BigInt inputs", async function () {
        const cliProof = {
            pi_a: [
                BigInt("10659168922133535108941299773816046807016626530129353669092766022696001072363"),
                BigInt("11312819100873997810050969372748115686998995583518000086014834118336558143648")
            ],
            pi_b: [
                [
                    BigInt("1422757499669082423362186222583466843556607365321327214899723231451908354132"),
                    BigInt("14993935769818257805853844882248693064834582322895323927771917737697342897890")
                ],
                [
                    BigInt("12140767016374648604246204461524323439853081121019320414014164044392797124070"),
                    BigInt("19370480984471627845507940342950708680718169076514297179507072645307807327751")
                ]
            ],
            pi_c: [
                BigInt("11072258446674272962559800389042110346830471975668711910878397567783291113385"),
                BigInt("9824589335918580963680640539618430914368698608281181048990036886348123589255")
            ]
        };

        const cliPublicSignals = [
            BigInt("3263891328514690275989582704956469647777272079756159583858971214078220291147"),
            BigInt("18376937429931012169342594711555484013645392719913217668397387900152353592299"),
            BigInt("17394930391925300108817479868273631768149416197982190703017777126669817237778")
        ];

        console.log("Testing with BigInt inputs:");
        console.log("Proof A:", cliProof.pi_a);
        console.log("Proof B:", cliProof.pi_b);
        console.log("Proof C:", cliProof.pi_c);
        console.log("Public Signals:", cliPublicSignals);

        try {
            const result = await verifierContract.verifyProof(
                cliProof.pi_a,
                cliProof.pi_b,
                cliProof.pi_c,
                cliPublicSignals
            );
            console.log("BigInt verification result:", result);
            expect(result).toBe(true);
        } catch (error) {
            console.error("BigInt verification failed:", error);
            throw error;
        }
    });
});

