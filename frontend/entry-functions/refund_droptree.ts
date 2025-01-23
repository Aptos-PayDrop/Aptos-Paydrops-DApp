import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

import { MODULE_ADDRESS } from "@/constants";
import { U256 } from "@aptos-labs/ts-sdk";


type RefundDropTreeArgs = {
  root: bigint,
}

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