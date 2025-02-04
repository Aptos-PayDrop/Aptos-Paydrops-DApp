import { generateMerkleTree } from "@/crypto/merkletree";
import { buildHashImplementation, generateCommitmentHash, hashAddressForSnark, rbigint } from "@/crypto/utils";
import { AccountAddress, convertAmountFromHumanReadableToOnChain, } from "@aptos-labs/ts-sdk";

export enum Progress {
    initalProgress,
    started,
    error,
    verifyinReport,
    verifyDone,
    miningstart,
    miningdone,
    treeProgress,
}

export async function verifyAndBuildTree(
    parsedCSV: Array<Array<string>>,
    decimals: number,
    onError: (reason: string) => void,
    onSuccess: (result: any) => void,
    onProgress: (progress: Progress, message: string, progressIndicator: number) => void
) {
    await buildHashImplementation();
    let size = parsedCSV.length;;

    const commitments = [];
    const addresses = [];
    const amounts = [];

    const nonce = rbigint();

    for (let i = 0; i < size - 1; i++) {

        let row = parsedCSV[i];
        //SO now Here I start validating and computing the commitments!
        let address = row[0] as string;
        let amount = parseFloat(row[1] as string);



        let onchainAmount = convertAmountFromHumanReadableToOnChain(amount, decimals);
        const account_address = AccountAddress.from(address);

        const bcsBytes = account_address.bcsToBytes();
        const address_hashBigint = await hashAddressForSnark(bcsBytes);

        addresses.push(address);
        amounts.push(amount);

        const commitment = await generateCommitmentHash(address_hashBigint, onchainAmount, nonce);

        commitments.push(commitment);



    }


    const { root, tree } = await generateMerkleTree(commitments, onProgress).catch((err) => {
        console.error(err);
        onError("Mining Merkle Tree Failed");
    }).then((res: any) => {
        onProgress(Progress.miningdone, "Mining done", 100);

        return res;
    });




    onSuccess({
        leaves: commitments,
        root,
        tree,
        addresses,
        amounts,
        nonce,
        decimals
    });
}

export function getPercentageComputed(current: number, total: number, finalMultiplier: number) {
    console.log("Percentage computed")
    //Get the percentage of current from total

    const percentage = (100 * current) / total
    return Math.floor(finalMultiplier * percentage)
}