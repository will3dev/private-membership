import createBlakeHash from "blake-hash";
import { sha256 } from "js-sha256";
import { SHA_256_MAX_DIGEST, BASE_POINT_ORDER, BN254_SCALAR_FIELD } from "./constants";
import { Scalar } from "./scalar";
import { stringToHex, concatHex, keccak256 } from "viem";


const SUB_GROUP_ORDER = BASE_POINT_ORDER;
const FR = BN254_SCALAR_FIELD;
const SALT_SID = "PMR/v1/derive-secretId";

/**
 * formats private key for the curve
 * @param key hex string
 * @returns bigint
 */
export const formatKeyForCurve = (key: string): bigint => {
  let hash = createBlakeHash("blake512")
    .update(Buffer.from(key, "hex"))
    .digest();

  const hashBuffer = hash.subarray(0, 32);

  const pruneBuffer = (buff: Buffer): Buffer => {
    if (buff.length < 32) {
      throw new Error("Buffer must be at least 32 bytes long");
    }

    const newBuff = Buffer.from(buff);

    // ensures that 
    newBuff[0] = (newBuff[0] ?? 0) & 0xf8; // clear the lower three bits setting them to 0
    newBuff[31] = ((newBuff[31] ?? 0) & 0x7f) | 0x40; // sets bit 6 to 1

    return newBuff;
  };

  const leBufferToBigInt = (buff: Buffer) =>
    BigInt(`0x${Buffer.from(buff).reverse().toString("hex")}`);

  const prunedBuffer = pruneBuffer(hashBuffer);
  const hashBigInt = leBufferToBigInt(prunedBuffer);

  // need to make sure that it is in the correct range
  return Scalar.shiftRight(hashBigInt, 3) % SUB_GROUP_ORDER;
};

export const getPrivateKeyFromSignature = (signature: string): string => {
  const fixed = signature.replace(/^0x/, "");
  const r = fixed.slice(0, 64);
  return grindKey(r);
};

export const grindKey = (seed: string): string => {
  const limit = SUB_GROUP_ORDER;
  const iterationLimit = 1_000;
  const maxAllowedValue = SHA_256_MAX_DIGEST - (SHA_256_MAX_DIGEST % limit);

  let i = 0;
  let key = hashKeyWithIndex(seed, i);
  i++;

  // make sure that key is in the max allowed range
  while (key >= maxAllowedValue) {
    key = hashKeyWithIndex(seed, i);
    i++;

    if (i > iterationLimit) {
      throw new Error("Could not find a valid key");
    }
  }

  return (key % limit).toString(16);
};

export const getSecretIdFromSignature = (signature: `0x${string}`): string => {
  const salted = keccak256(concatHex([stringToHex(SALT_SID), signature]));
  const fixed = signature.replace(/^0x/, "");
  const r = fixed.slice(0, 64);
  return grindKeyId(r);
};

export const grindKeyId = (seed: string): string => {
  const limit = FR;
  const iterationLimit = 1_000;
  const maxAllowedValue = SHA_256_MAX_DIGEST - (SHA_256_MAX_DIGEST % limit);

  let i = 0;
  let key = hashKeyWithIndex(seed, i);
  i++;

  // make sure that key is in the max allowed range
  while (key >= maxAllowedValue) {
    key = hashKeyWithIndex(seed, i);
    i++;

    if (i > iterationLimit) {
      throw new Error("Could not find a valid key");
    }
  }

  return (key % limit).toString(16);
};


const removeHexPrefix = (hex: string) => hex.replace(/^0x/, "");

const numberToHex = (num: number) => num.toString(16);

const sanitizeBytes = (str: string, byteSize = 8) =>
  padLeft(str, calculateByteLength(str.length, byteSize), "0");

const padLeft = (str: string, length: number, padding = "0") =>
  padString(str, length, true, padding);

const padString = (
  str: string,
  length: number,
  toLeft: boolean,
  padding = "0",
) => {
  const diff = length - str.length;
  let result = str;
  if (diff > 0) {
    const pad = padding.repeat(diff);
    result = toLeft ? pad + str : str + pad;
  }
  return result;
};

const calculateByteLength = (length: number, byteSize = 8) => {
  const remainder = length % byteSize;
  return remainder
    ? ((length - remainder) / byteSize) * byteSize + byteSize
    : length;
};

const hashKeyWithIndex = (key: string, index: number) => {
  const input = removeHexPrefix(key) + sanitizeBytes(numberToHex(index), 2);
  const buff = Buffer.from(removeHexPrefix(input), "hex");
  const uint8Array = new Uint8Array(buff);
  return BigInt(`0x${sha256.update(uint8Array).hex()}`);
};

