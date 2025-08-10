import { describe, it, expect, beforeAll } from "vitest";
import { createPublicClient, http, createWalletClient, parseAbi } from "viem";
import { foundry } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const client = createPublicClient({ chain: foundry, transport: http("http://127.0.0.1:8545") });
const account = privateKeyToAccount("0x59c6995e998f97a5a0044976f27a9b0a5e6b0b9f3b6c1d5f62c7b5f1b5c6d7e0"); // anvil default[0]
const wallet = createWalletClient({ account, chain: foundry, transport: http("http://127.0.0.1:8545") });

const abi = parseAbi([
  "function n() view returns (uint256)",
  "function inc()"
]);

let addr: `0x${string}`;

beforeAll(async () => {
  const artifact = await import("../out/Counter.sol/Counter.json");
  const hash = await wallet.deployContract({ abi, bytecode: artifact.bytecode.object as `0x${string}` });
  const receipt = await client.waitForTransactionReceipt({ hash });
  addr = receipt.contractAddress!;
});

describe("Counter", () => {
  it("increments", async () => {
    const before = await client.readContract({ address: addr, abi, functionName: "n" });
    await wallet.writeContract({ address: addr, abi, functionName: "inc" });
    const after = await client.readContract({ address: addr, abi, functionName: "n" });
    expect(Number(after)).toBe(Number(before) + 1);
  });
});
