import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import {
    convertAmountFromHumanReadableToOnChain,

} from "@/utils/helpers";
import { MODULE_ADDRESS } from "@/constants";
import { U256, U64, AccountAddress, MoveVector } from "@aptos-labs/ts-sdk";


type ClaimDropTreeArgs = {
    sponsor: string,
    root: bigint,
    amount: number,
    amount_decimals: number,
    nonce: bigint,
    proof: Array<bigint>
}
//The claim droptree function allows the payee to withdraw funds
export const claimDroptree = (args: ClaimDropTreeArgs): InputTransactionData => {
    return {
        data: {
            function: `${MODULE_ADDRESS}::paydrop::claim_paydrop`,
            functionArguments: [
                AccountAddress.fromString(args.sponsor),
                new U256(args.root),
                new U64(convertAmountFromHumanReadableToOnChain(args.amount, args.amount_decimals)),
                new U256(args.nonce),
                new MoveVector(args.proof.map((p) => new U256(p)))
            ]
        }
    }
}