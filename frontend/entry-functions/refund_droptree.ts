import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

import { MODULE_ADDRESS } from "@/constants";
import { U256 } from "@aptos-labs/ts-sdk";


type RefundDropTreeArgs = {
  root: bigint,
}
//Refunds the droptree to the funding addresss, only the unclaimed payments are refunded
export const refundDroptree = (args: RefundDropTreeArgs): InputTransactionData => {
  return {
    data: {
      function: `${MODULE_ADDRESS}::paydrop::refund_droptree`,
      functionArguments: [
       new U256(args.root)
      ]
    }
  }
}