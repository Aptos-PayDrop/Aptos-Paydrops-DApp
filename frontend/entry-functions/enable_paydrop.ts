import { MODULE_ADDRESS } from "@/constants"
import { U256 } from "@aptos-labs/ts-sdk"
import { InputTransactionData } from "@aptos-labs/wallet-adapter-react"


type EnablePaydropArgs = {
    root: bigint
}

//The enable paydrop function allows the address that created the droptree to allow withdrawing
export const enablePaydrop = (args: EnablePaydropArgs): InputTransactionData => {
    return {
        data: {
            function: `${MODULE_ADDRESS}::paydrop::enable_droptree`,
            functionArguments: [
                new U256(args.root)
            ]
        }
    }
}