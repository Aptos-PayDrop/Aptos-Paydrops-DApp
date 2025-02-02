import { aptosClient } from "@/utils/aptosClient";
import { Ed25519PublicKey } from "@aptos-labs/ts-sdk";
import { InputTransactionData } from "@aptos-labs/wallet-adapter-core";

//Used for simulating transacitons during development
export async function simulateTx(account: any, inputTransaction: InputTransactionData) {
    const aptos = aptosClient();
    const tx = await aptos.transaction.build.simple({
        sender: account.address,
        data: inputTransaction.data
    })

    const [userSimulatedResponse] = await aptos.transaction.simulate.simple({
        signerPublicKey: new Ed25519PublicKey(account.publicKey as string),
        transaction: tx
    })

    console.log(userSimulatedResponse)
}