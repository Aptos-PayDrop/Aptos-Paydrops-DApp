
import { buildHashImplementation, hashAddressForSnark } from "../lib/index.js";
import assert from "assert";
import { encodeForCircuit, generateMerkleProof, generateMerkleTree, getMerkleRootFromMerkleProof, populateTree } from "../lib/merkletree.js";
/**
 * This is a test input, generated for the starting circuit.
 * If you update the inputs, you need to update this function to match it.
 */

export async function getInput() {
    await buildHashImplementation();

    const size = 1;

    const { addresses, amounts, commitments, bcsBytesArray } = await populateTree(size);
    // console.log(addresses);
    const merkleTree = await generateMerkleTree(structuredClone(commitments));

    const merkleProof = await generateMerkleProof(commitments[0], structuredClone(commitments), null);

    const merkleRoot = await getMerkleRootFromMerkleProof(merkleProof);
    assert.equal(merkleTree.root, merkleRoot)

    const encodedProof = encodeForCircuit(merkleProof);

    const addressHash = await hashAddressForSnark(bcsBytesArray[0]);

    return {
        address: addressHash,
        amount: amounts[0],

        pathElements: encodedProof.pathElements,
        pathIndices: encodedProof.pathIndices,
        root: merkleRoot,
    }

}

// Assert the output for hotreload by returning the expected output
// Edit this to fit your circuit
export async function getOutput() {
    return { out: 0 }
}

