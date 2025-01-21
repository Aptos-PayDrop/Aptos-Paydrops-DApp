import {AccountAddress} from "@aptos-labs/ts-sdk";
import { aptosClient } from "@/utils/aptosClient";
import { MODULE_ADDRESS } from "@/constants";

export const getFee = async () =>{
    const result = await aptosClient().view<[string]>({
        payload:{
            function: `${AccountAddress.from(MODULE_ADDRESS)}::paydrop::get_fee`,
            functionArguments: []
        }
    })
    return result[0]
}