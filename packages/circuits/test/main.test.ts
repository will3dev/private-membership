import { describe, it, expect } from "vitest";
import path from "node:path";
import { wasm as wasmTester } from "circom_tester";

describe("main.circom", () => {
  it("adds two numbers", async () => {
    const circuit = await wasmTester(path.join(__dirname, "../circuits/main.circom"));
    await circuit.loadConstraints();
    const w = await circuit.calculateWitness({ a: 3, b: 11 }, true);
    await circuit.checkConstraints(w);
    
    // Debug: Let's see the full witness array
    console.log("Full witness array:", w);
    console.log("Array length:", w.length);
    
    // Try different indices
    console.log("w[0]:", w[0]); // Should be input a (3)
    console.log("w[1]:", w[1]); // Should be input b (11)
    console.log("w[2]:", w[2]); // Should be output c (14)
    
    const out = w[1]; // Try index 2 for the output
    expect(Number(out)).toBe(14);
  });
});
