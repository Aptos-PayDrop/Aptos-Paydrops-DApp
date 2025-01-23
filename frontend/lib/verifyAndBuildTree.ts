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

// TODO: I need to pass decimals
export async function verifyAndBuildTree(
    parsedCSV: Array<Array<string>>,
    decimals: number,
    onError: (reason: string) => void,
    onSuccess: (result: any) => void,
    onProgress: (progress: Progress, message: string) => void
) {
    onProgress(Progress.miningstart, "Computing commitments")
    await buildHashImplementation();
    let size = parsedCSV.length;;

    const commitments = [];
    const addresses = [];
    const amounts = [];

    const nonce = rbigint();

    for (let i = 0; i < size; i++) {

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

    onProgress(Progress.miningstart, "Generating Merkle Tree");

    const { root, tree } = await generateMerkleTree(commitments, onProgress).catch((err) => {
        onError("Mining Merkle Tree Failed");
    }).then((res: any) => {
        return res;
    });
    onProgress(Progress.miningdone, "Mining done");




    //TODO: decimals?
    //TODO: Fungible Asset Address
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

//TODO: convert the amounts with the decimals. 
function convertAmountsWithDecimals() {

}