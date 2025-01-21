import {AccountAddress,U256} from "@aptos-labs/ts-sdk";
import { aptosClient } from "@/utils/aptosClient";
import { MODULE_ADDRESS } from "@/constants";

type DropTreeDetailsArg = {
    sponsor: string,
    root: bigint
}

export const DropTreeDetails = async ({sponsor,root}: DropTreeDetailsArg) =>{
const result = await aptosClient().view<[string,string,string,string,Object,boolean]>({
    payload: {
        function: `${AccountAddress.from(MODULE_ADDRESS)}::paydrop::droptree_details`,
        functionArguments: [sponsor, new U256(root)]
    }
})

   return {
    total_deposit:result[0],
    deposit_left: result[1],
    total_leaves: result[2],
    unused_leaves: result[3],
    fa_metadata_object: result[4],
    enabled: result[5]
   }
}