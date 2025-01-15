
import { utils } from "ffjavascript";
import crypto from "crypto";
import assert from "assert";
import { buildPoseidon } from "circomlibjs";
import { groth16 } from "snarkjs";
    

/**
 * @returns {bigint} Returns a random bigint
 */
export function rbigint() { return utils.leBuff2int(crypto.randomBytes(31)) };
   
//The hash implementation is stored local scoped to avoid rebuilding it multiple times
let hashimpl = null;

/**
 * Builds the hashing algorithm
 */
export async function buildHashImplementation() {
    if (!hashimpl) {
        const hasher = await buildPoseidon();
        hashimpl = { hasher };
    }
}

/**
* @param args {Array<bigint>} - A list of bigint to compute the hash
* @returns {bigint} Returns the poseidon hash
*/
export async function poseidon(args) {
    const hashBytes = hashimpl.hasher(args);
    const hash = hashimpl.hasher.F.toString(hashBytes);
    return BigInt(hash);
}

/**
 * 
 * @param address {string | bigint} - The aptos address
 * @param amount {string | bigint} - The amount of tokens allowed to withdraw
 * @returns {bigint} Returns a poseidon hash
 */
export async function generateCommitmentHash(address, amount){
    return await poseidon([BigInt(address),BigInt(amount)])
}

/** Hashes the leaves of a merkle tree from left to right
 * @param left {bigint} - The left leaf node
 * @param right {bigint} - The right leaf node
 * @returns {bigint} - Returns the poseidon hash
 */
export async function hashLeaves(left, right) {
    return await poseidon([BigInt(left), BigInt(right)]);
}
    
/**
 * @param {Object} options - The arguments for the compute proof
 * @param {bigint | string} options.secret - The secret used for the commitment reveal scheme
 * @param {bigint | string} options.nullifier
 * @param {Array<bigint> | Array<string>} options.pathElements
 * @param {Array<number>} options.pathIndices
 * 
 * @param {Object} options.publicInputs
 * @param {bigint | string} options.publicInputs.commitmentHash
 * @param {bigint | string} options.publicInputs.nullifierHash - The nullifier used for mitigating replay attacks * 
 * @param {bigint | string} options.publicInputs.root - The root hash of the merkle tree

 * @param {Object | undefined} options.snarkArtifacts - Paths to the artifacts used for generating the proof. If undefined, default values will be used. It allows for file system paths and urls.
 * @param {string} options.snarkArtifacts.wasmFilePath - Path to the generated witness file
 * @param {string} options.snarkArtifacts.zkeyFilePath - Path to the generated zKey file
 */ 
export async function computeProof({secret, nullifier,pathElements, pathIndices,  publicInputs, snarkArtifacts}){
    const input = {
      //Private inputs
      secret,
      nullifier,
      pathElements, pathIndices, 
      
      //Public inputs
      ...publicInputs        
    }

    if(!snarkArtifacts){
        snarkArtifacts = {
            wasmFilePath: "circuits/compiled/circuit_js/circuit.wasm", 
            zkeyFilePath: "circuits/compiled/zkeys/circuit_final.zkey",
        }
       }

    const {proof, publicSignals} = await groth16.fullProve(
        input,
        snarkArtifacts.wasmFilePath,
        snarkArtifacts.zkeyFilePath
       )

    return {proof, publicSignals}
}
    /**
 * Verifies a SnarkJS proof.
 * @param verificationKey The zero-knowledge verification key.
 * @param fullProof The SnarkJS full proof.
 * @returns {boolean} True if the proof is valid, false otherwise.
 */

export function verifyProof({verificationKey, proof, publicSignals }) {
    return groth16.verify(
        verificationKey,
        publicSignals,
        proof,
    );
}
