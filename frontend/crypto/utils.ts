//@ts-ignore
import { utils } from "ffjavascript";

import crypto from "crypto";
import { buildPoseidon } from "circomlibjs";
import { groth16 } from "snarkjs";
import Blake2b from "blake2b-wasm";


//Returns false if wasm is not supported by the browser
export function isWasmSupported() {
    return Blake2b.SUPPORTED;
}

export async function hashAddressForSnark(address_bytes: Buffer | Uint8Array): Promise<bigint> {
    return new Promise(function (resolve, reject) {
        Blake2b.ready(function (err: any) {
            if (err) reject(err);

            //Hash the address_bytes
            const hashBuff = Blake2b().update(address_bytes).digest();
            //convert to 31 bytes by slicing off the last byte
            const hashSlice = hashBuff.slice(0, 31);
            // //convert to hex string         
            resolve(convertHashToBigInt(hashSlice));
        })
    })
}


function convertHashToBigInt(byte: Uint8Array) {
    let accumulator = BigInt(byte[0]);

    for (let i = 1; i < 31; i++) {
        let shift = BigInt(i) * 8n;
        accumulator += BigInt(byte[i]) << shift;
    }
    return accumulator;
}

/**
 * @returns {bigint} Returns a random bigint
 */
export function rbigint() { return utils.leBuff2int(crypto.randomBytes(31)) };


//The hash implementation is stored local scoped to avoid rebuilding it multiple times
let hashimpl: any = null;

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
export async function poseidon(args: Array<BigInt>) {
    const hashBytes = hashimpl.hasher(args);
    const hash = hashimpl.hasher.F.toString(hashBytes);
    return BigInt(hash);
}


/**
 * 
 * @param address {string | bigint} - The aptos address
 * @param amount {string | bigint} - The amount of tokens allowed to withdraw
 * @param nonce {string | bigint} - Allow repeatability for addresses and amounts using a nonce
 * @returns {bigint} Returns a poseidon hash
 */
export async function generateCommitmentHash(address: string | bigint, amount: string | bigint | number, nonce: string | bigint) {
    return await poseidon([BigInt(address), BigInt(amount), BigInt(nonce)])
}

/** Hashes the leaves of a merkle tree from left to right
 * @param left {bigint} - The left leaf node
 * @param right {bigint} - The right leaf node
 * @returns {bigint} - Returns the poseidon hash
 */
export async function hashLeaves(left: bigint, right: bigint) {
    return await poseidon([BigInt(left), BigInt(right)]);
}


/**
 * @param {Object} options - The arguments for the compute proof
 * @param {Array<bigint> | Array<string>} options.pathElements
 * @param {Array<number>} options.pathIndices
 * 
 * @param {Object} options.publicInputs
 * @param {bigint | string} options.publicInputs.root - The root hash of the merkle tree

 * @param {Object | undefined} options.snarkArtifacts - Paths to the artifacts used for generating the proof. If undefined, default values will be used. It allows for file system paths and urls.
 * @param {string} options.snarkArtifacts.wasmFilePath - Path to the generated witness file
 * @param {string} options.snarkArtifacts.zkeyFilePath - Path to the generated zKey file
 */
export async function computeProof({ pathElements, pathIndices, publicInputs, snarkArtifacts }: {
    pathElements: Array<bigint> | Array<string>,
    pathIndices: Array<bigint> | Array<string>,
    publicInputs: Object,
    snarkArtifacts: {
        wasmFilePath: string,
        zkeyFilePath: string
    }
}) {
    const input = {
        //Private inputs
        pathElements, pathIndices,

        //Public inputs
        ...publicInputs
    } as any

    if (!snarkArtifacts) {
        snarkArtifacts = {
            wasmFilePath: "circuits/compiled/circuit_js/circuit.wasm",
            zkeyFilePath: "circuits/compiled/zkeys/circuit_final.zkey",
        }
    }

    const { proof, publicSignals } = await groth16.fullProve(
        input,
        snarkArtifacts.wasmFilePath,
        snarkArtifacts.zkeyFilePath
    )

    return { proof, publicSignals }
}
/**
* Verifies a SnarkJS proof.
* @param verificationKey The zero-knowledge verification key.
* @param fullProof The SnarkJS full proof.
* @returns {boolean} True if the proof is valid, false otherwise.
*/

export function verifyProof({ verificationKey, proof, publicSignals }: {
    verificationKey: any,
    proof: any,
    publicSignals: any
}) {
    return groth16.verify(
        verificationKey,
        publicSignals,
        proof,
    );
}

