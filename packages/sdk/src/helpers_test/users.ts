// npm i -D viem @noble/curves
import { createWalletClient, http, keccak256, stringToHex, concatHex } from "viem";
import { generatePrivateKey, privateKeyToAccount} from "viem/accounts";
import { mainnet } from "viem/chains";

// 1) make a test account
const priv = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const account = generatePrivateKey();
const wallet = createWalletClient({ chain: mainnet, transport: http() }); // transport unused for signing

// TO DO: complete building user should use example from eERC as template
export class User {

}


/*
// --- personal_sign (string message) ---
const message =
  "PrivateMembershipPoints: derive BJJ key\n" +
  `addr:${account.address}\nchainId:1\nsalt:PMR/v1/derive`;
const sigPersonal = await wallet.signMessage({ account, message });
// sigPersonal: 0x...65-byte ECDSA
*/


/* SAVING FOR LATER, STARTING SIMPLE
// --- EIP-712 typed data (recommended UX) ---
const domain = { name: "PrivateMembershipPoints", version: "1", chainId: 1 };
const types = {
  DeriveKey: [
    { name: "purpose", type: "string" },
    { name: "address", type: "address" },
    { name: "salt",    type: "string" },
  ],
} as const;
const value = {
  purpose: "derive BabyJubJub key",
  address: account.address,
  salt: "PMR/v1/derive",
};
const sig712 = await wallet.signTypedData({
  account, domain, types, primaryType: "DeriveKey", message: value,
});

// (optional) sanity: recover address
import { recoverAddress, hashTypedData } from "viem";
const digest = hashTypedData({ domain, types, primaryType: "DeriveKey", message: value });
const recovered = await recoverAddress({ hash: digest, signature: sig712 });

*/
