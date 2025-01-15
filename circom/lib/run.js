
import readline from "node:readline";
import { populateTree, generateMerkleTree, generateMerkleProof, getMerkleRootFromMerkleProof } from "./merkletree.js";
import fs from "fs";
import path from "path";
import { buildHashImplementation } from "./index.js";



const privateDir = "./private";
const publicDir = "./public";

async function main() {
    await buildHashImplementation();
    const action = process.argv[2];

    const r1 = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    switch (action) {
        case "new":
            console.log("CREATING A NEW MERKLE TREE\n")
            r1.question("Enter how many secrets would you like to generate:\n", async answer => {
                const valid = !isNaN(parseInt(answer));
                if (!valid) {
                    console.error("Error: not a valid number");
                    r1.close();
                    return;
                }
                

                console.log("Generating secrets and hashing commitments. Please wait!")
                const { secrets, nullifiers, commitments, nullifierHashes } = await populateTree(answer).then((res) => {
                    console.log("Done")
                    return res;
                });

                console.log("Generating merkle tree from commitments!");
                const { tree, root } = await generateMerkleTree(commitments).then((res) => {
                    console.log(`Done.Root is ${res.root} `);
                    return res;
                });

                console.log("Serializing data.")
                const privateData = JSON.stringify({ secrets, nullifiers }, (_, v) => typeof v === "bigint" ? v.toString(10) : v);

                const publicData = JSON.stringify({ commitments, nullifierHashes, root, tree }, (_, v) => typeof v === "bigint" ? v.toString(10) : v);

                const privatePath = path.join(process.cwd(), privateDir, root.toString(10) + ".json");
                const publicPath = path.join(process.cwd(), publicDir, root.toString(10) + ".json");
                console.log("Writing to file.")

                if (!fs.existsSync(path.join(process.cwd(), privateDir))) {
                    fs.mkdirSync(path.join(process.cwd(), privateDir))
                }

                if (!fs.existsSync(path.join(process.cwd(), publicDir))) {
                    fs.mkdirSync(path.join(process.cwd(), publicDir))
                }

                fs.writeFileSync(privatePath, privateData)
                fs.writeFileSync(publicPath, publicData);

                console.log("Done")

                r1.close();
            })
            break;
        case "proof": {
            r1.question("Enter the merkle root:\n", (root_answer) => {
                const publicPath = path.join(process.cwd(), publicDir, root_answer + ".json");
                if (!fs.existsSync(publicPath)) {
                    console.log("Merkle tree not found in public folder");
                    r1.close();
                    return;
                }

                const publicData = fs.readFileSync(publicPath);
                const deserializedPublicData = JSON.parse(publicData, (key, value) => {
                    if (typeof value === "string") {
                        return BigInt(value)
                    }

                    return value;
                });
                
                const commitments = deserializedPublicData.commitments;
                const tree = deserializedPublicData.tree;
                
                r1.question("Enter the commitment to verify\n", async commitment_answer => {
                    const index = findCommitmentByIndex(BigInt(commitment_answer), commitments);

                    if (index === -1) {
                        console.log("Commitment not found in tree")
                        r1.close();
                        return;
                    }
                    console.log("Computing merkle proof. Please wait!")
                    const merkleProof = await generateMerkleProof(BigInt(commitment_answer), commitments, tree);

                    console.log("Done! Merkle Proof:")

                    console.log(JSON.stringify({ merkleProof }, (_, v) => typeof v === "bigint" ? v.toString(10) : v));

                    r1.close();
                })
            })
            break;
        }

        case "verify": {
            r1.question("Enter the merkle root:\n", root_answer => {
                const entered_root = BigInt(root_answer);
                
                
                r1.question("Enter the merkle proof:\n", async proof_answer => {
                    const deserializedProof = JSON.parse(proof_answer, (key, value) => {
                        if (key === "hash") {
                            return BigInt(value);
                        }
                        return value;
                    })
                    console.log("Verifying proof. Please wait!")
                    const reducedRoot = await getMerkleRootFromMerkleProof(deserializedProof.merkleProof);
                    if (reducedRoot === entered_root) {
                        console.log("MERKLE PROOF VALID!")
                    } else {
                        console.log("INVALID PROOF!")
                    }
                    r1.close()
                })

            })
        }
            break;
        default:
            throw new Error("Unknown command")
    }
}

/**
 * Finds a commitment in the list of commitments
 * @param {BigInt} commitment_answer 
 * @param {Array<BigInt>} commitments 
 * @returns {number} - returns the index of the commitment or -1 if not found
 */

function findCommitmentByIndex(commitment_answer, commitments) {
    for (let i = 0; i < commitments.length; i++) {
        if (commitment_answer == commitments[i]) {
            return i;
        }
    }
    return -1;
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
})