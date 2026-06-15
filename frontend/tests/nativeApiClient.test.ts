import test from "node:test";
import assert from "node:assert/strict";
import { buildNativePqcRequestBody } from "../src/api/client.ts";

test("buildNativePqcRequestBody defaults pqNonce to auto for repeatable native submissions", () => {
  assert.deepEqual(
    buildNativePqcRequestBody({
      contractAddress: "0x6fDfeb70f1b4D35A7E11A2687B7bAf367cDeB7aA",
      value: "7"
    }),
    {
      nativePqcContractAddress: "0x6fDfeb70f1b4D35A7E11A2687B7bAf367cDeB7aA",
      value: "7",
      pqNonce: "auto",
      gasPrice: "1000",
      waitReceipt: true,
      debug: false
    }
  );
});
