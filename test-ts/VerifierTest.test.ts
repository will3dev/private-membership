import { ethers } from "ethers";
import { expect, beforeAll, describe, it } from "vitest";
import NewMembershipVerifierArtifact from "../out/NewMembershipVerifier.sol/Groth16Verifier.json" with { type: "json" };

describe("Verifier Contract Test", function () {
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

    it("should verify CLI-generated proof", async function () {
        // CLI-generated proof from circuits directory
        const cliProof = {
            pi_a: [
                "10659168922133535108941299773816046807016626530129353669092766022696001072363",
                "11312819100873997810050969372748115686998995583518000086014834118336558143648",
                "1"
            ],
            pi_b: [
                [
                    "1422757499669082423362186222583466843556607365321327214899723231451908354132",
                    "14993935769818257805853844882248693064834582322895323927771917737697342897890"
                ],
                [
                    "12140767016374648604246204461524323439853081121019320414014164044392797124070",
                    "19370480984471627845507940342950708680718169076514297179507072645307807327751"
                ],
                [
                    "1",
                    "0"
                ]
            ],
            pi_c: [
                "11072258446674272962559800389042110346830471975668711910878397567783291113385",
                "9824589335918580963680640539618430914368698608281181048990036886348123589255",
                "1"
            ]
        };

        const cliPublicSignals = [
            "3263891328514690275989582704956469647777272079756159583858971214078220291147",
            "18376937429931012169342594711555484013645392719913217668397387900152353592299",
            "17394930391925300108817479868273631768149416197982190703017777126669817237778"
        ];

        const proofPoints = {
            a: [cliProof.pi_a[0], cliProof.pi_a[1]], // Take first 2 elements
            b: [cliProof.pi_b[0], cliProof.pi_b[1]], // Take first 2 rows
            c: [cliProof.pi_c[0], cliProof.pi_c[1]]  // Take first 2 elements
        };

        try {
            const result = await verifierContract.verifyProof(
                proofPoints.a,
                proofPoints.b,
                proofPoints.c,
                cliPublicSignals
            );
            console.log("CLI proof verification result:", result);
            expect(result).toBe(true);
        } catch (error) {
            console.error("CLI proof verification failed:", error);
            throw error;
        }
    });
});