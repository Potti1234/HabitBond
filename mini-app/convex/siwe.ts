"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { ethers } from "ethers";

const EIP_1271_ABI = [
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_hash",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "_signature",
        "type": "bytes"
      }
    ],
    "name": "isValidSignature",
    "outputs": [
      {
        "internalType": "bytes4",
        "name": "magicValue",
        "type": "bytes4"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
const EIP_1271_MAGIC_VALUE = "0x1626ba7e";

export const verifySignature = internalAction({
  args: {
    address: v.string(),
    message: v.string(),
    signature: v.string(),
  },
  handler: async (_, { address, message, signature }) => {
    const rpcUrl = process.env.WORLDCHAIN_RPC_URL;
    if (!rpcUrl) {
      throw new Error("WORLDCHAIN_RPC_URL environment variable not set! Please set it in your project settings.");
    }

    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
        return true;
      }
    } catch (e) {
      // It's expected that this will fail for smart contract wallets
    }

    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(address, EIP_1271_ABI, provider);
      const messageHash = ethers.hashMessage(message);

      const returnValue = await contract.isValidSignature(messageHash, signature);

      const isValid = returnValue.toLowerCase() === EIP_1271_MAGIC_VALUE.toLowerCase();
      return isValid;

    } catch (error) {
      console.error("EIP-1271 verification failed:", error);
      return false;
    }
  },
}); 