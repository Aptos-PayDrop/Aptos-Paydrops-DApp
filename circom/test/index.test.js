
import assert from "assert";
import { computeProof, verifyProof } from "../lib/index";
import fs from "fs";
import { getInput } from "./input.js";

it("Test commit-reveal scheme with fixed merkle tree", async function () {
    const { address, amount, pathElements, pathIndices, root,nonce } = await getInput();
    //When compiling the tests via `niftyzk verificationkey` the path of the zkey used is written into a file so you don't have to adjust the tests when using different zkeys
    const zkeyPath = fs.readFileSync("circuits/compiled/vk_meta.txt", "utf-8")
    console.log(address);
    console.log("root", root)
    const { proof, publicSignals } = await computeProof({

        pathElements,
        pathIndices,
        publicInputs: {
            root,
            address,
            amount,
            nonce

        },
        snarkArtifacts: {
            wasmFilePath: "circuits/compiled/circuit_js/circuit.wasm",
            zkeyFilePath: zkeyPath,
        }
    })
    console.log("proof", JSON.stringify(proof));
    
    console.log(publicSignals)
    const verificationKeyFile = fs.readFileSync("circuits/compiled/verification_key.json", "utf-8");
    const verificationKey = JSON.parse(verificationKeyFile);
    const result = await verifyProof({ verificationKey, proof, publicSignals })
    assert.equal(result, true)


}, 50000)
