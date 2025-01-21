import {AccountAddress,U256} from "@aptos-labs/ts-sdk";
import { aptosClient } from "@/utils/aptosClient";
import { MODULE_ADDRESS } from "@/constants";


type GetIsNullifiedArg = {
    sponsor: string,
    root: bigint,
    recipient: string
}

export const getIsNullified = async ({sponsor, root, recipient}: GetIsNullifiedArg) =>{
    const result = await aptosClient().view<[boolean]>({
        payload: {
           function: `${AccountAddress.from(MODULE_ADDRESS)}::paydrop::is_nullified`,
           functionArguments: [sponsor,new U256(root),recipient]
        }
    })
    return result[0];
}