import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import {
  convertAmountFromHumanReadableToOnChain,

} from "@/utils/helpers";
import { MODULE_ADDRESS } from "@/constants";
import {Bool, U256, U64,AccountAddress } from "@aptos-labs/ts-sdk";


type NewDropTreeArgs = {
  root: bigint,
  fa_address: string,
  total_deposit: number,
  total_deposit_decimals: number,
  total_leaves: number,
  enabled: boolean,
  url: string
}

//TODO: make sure total_deposit is not overflowing the max number

export const newDroptree = (args: NewDropTreeArgs): InputTransactionData => {
  return {
    data: {
      function: `${MODULE_ADDRESS}::paydrop::new_droptree`,
      functionArguments: [
        new U256(args.root),
        AccountAddress.fromString(args.fa_address),
        new U64(convertAmountFromHumanReadableToOnChain(args.total_deposit, args.total_deposit_decimals)),
        new U64(args.total_leaves),
        new Bool(args.enabled),
        args.url
      ]
    }
  }
}