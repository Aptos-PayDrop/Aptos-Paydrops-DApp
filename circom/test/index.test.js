
import assert from "assert";
import { computeProof, verifyProof } from "../lib/index";
import fs from "fs";
import { getInput } from "./input.js";

it("Test commit-reveal scheme with fixed merkle tree", async function () {
    const { address, amount, pathElements, pathIndices, root, nonce } = await getInput();
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

    const verificationKeyFile = fs.readFileSync("circuits/compiled/verification_key.json", "utf-8");
    const verificationKey = JSON.parse(verificationKeyFile);
    const result = await verifyProof({ verificationKey, proof, publicSignals })


    assert.equal(result, true)
    
    // generateMoveTestParameters(verificationKey,proof,publicSignals)

}, 50000)


//Copy paste to update move tests with this!
function generateMoveTestParameters(verificationKey, proof, publicSignals) {
    console.log(`
   let vk_alpha_x :u256 = ${verificationKey.vk_alpha_1[0]};
   let vk_alpha_y :u256 = ${verificationKey.vk_alpha_1[1]};

   let vk_beta_x1 :u256 = ${verificationKey.vk_beta_2[0][0]};
   let vk_beta_y1 :u256 = ${verificationKey.vk_beta_2[0][1]};
   let vk_beta_x2 :u256 =  ${verificationKey.vk_beta_2[1][0]};
   let vk_beta_y2 :u256 = ${verificationKey.vk_beta_2[1][1]};

   let vk_gamma_x1 :u256 =  ${verificationKey.vk_gamma_2[0][0]};
   let vk_gamma_y1 :u256 = ${verificationKey.vk_gamma_2[0][1]};
   let vk_gamma_x2 :u256 = ${verificationKey.vk_gamma_2[1][0]};
   let vk_gamma_y2 :u256 = ${verificationKey.vk_gamma_2[1][1]};

   let vk_delta_x1: u256 = ${verificationKey.vk_delta_2[0][0]};
   let vk_delta_y1 :u256 = ${verificationKey.vk_delta_2[0][1]};
   let vk_delta_x2 :u256 = ${verificationKey.vk_delta_2[1][0]};
   let vk_delta_y2 :u256 = ${verificationKey.vk_delta_2[1][1]};

   let vk_gamma_abc_1_x :u256 = ${verificationKey.IC[0][0]};
   let vk_gamma_abc_1_y :u256 = ${verificationKey.IC[0][1]};
   let vk_gamma_abc_2_x :u256 = ${verificationKey.IC[1][0]};
   let vk_gamma_abc_2_y :u256 = ${verificationKey.IC[1][1]};
   let vk_gamma_abc_3_x :u256 = ${verificationKey.IC[2][0]};
   let vk_gamma_abc_3_y :u256 = ${verificationKey.IC[2][1]};
   let vk_gamma_abc_4_x :u256 = ${verificationKey.IC[3][0]};
   let vk_gamma_abc_4_y :u256 = ${verificationKey.IC[3][1]};
   `);

    console.log(`
        let a_x: u256 = ${proof.pi_a[0]};
        let a_y: u256 = ${proof.pi_a[1]};
        let b_x1: u256 =${proof.pi_b[0][0]};
        let b_y1: u256 =${proof.pi_b[0][1]};
        let b_x2: u256 =${proof.pi_b[1][0]};
        let b_y2: u256 =${proof.pi_b[1][1]};
        let c_x: u256 = ${proof.pi_c[0]};
        let c_y: u256 = ${proof.pi_c[1]};
    `);

    console.log(JSON.stringify(publicSignals));
    console.log(JSON.stringify(proof))

}