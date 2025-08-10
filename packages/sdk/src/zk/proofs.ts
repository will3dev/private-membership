import { groth16, plonk } from "snarkjs";
export async function genProofGroth16(wasmPath: string, zkeyPath: string, input: any) {
  const { proof, publicSignals } = await groth16.fullProve(input, wasmPath, zkeyPath);
  return { proof, publicSignals };
}
export async function verifyGroth16(vk: any, publicSignals: any, proof: any) {
  return groth16.verify(vk, publicSignals, proof);
}
