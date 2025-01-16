
import assert from "assert";
import { computeProof, verifyProof } from "../lib/index";
import fs from "fs";
import { getInput } from "./input.js";
import { utils } from "ffjavascript"
const { unstringifyBigInts, stringifyBigInts } = utils;

it("Test commit-reveal scheme with fixed merkle tree", async function () {
    const { address, amount, pathElements, pathIndices, root } = await getInput();
    //When compiling the tests via `niftyzk verificationkey` the path of the zkey used is written into a file so you don't have to adjust the tests when using different zkeys
    const zkeyPath = fs.readFileSync("circuits/compiled/vk_meta.txt", "utf-8")
    const { proof, publicSignals } = await computeProof({

        pathElements,
        pathIndices,
        publicInputs: {
            root,
            address,
            amount

        },
        snarkArtifacts: {
            wasmFilePath: "circuits/compiled/circuit_js/circuit.wasm",
            zkeyFilePath: zkeyPath,
        }
    })
    // console.log("root", root);
    // console.log("address", address);
    // console.log("address bigint", BigInt(address));
    // console.log("amount", amount);

    // console.log(JSON.stringify(proof))
    // console.log(JSON.stringify(publicSignals))
    
    const verificationKeyFile = fs.readFileSync("circuits/compiled/verification_key.json", "utf-8");
    const verificationKey = JSON.parse(verificationKeyFile);
    const result = await verifyProof({ verificationKey, proof, publicSignals })
    assert.equal(result, true)


}, 50000)
