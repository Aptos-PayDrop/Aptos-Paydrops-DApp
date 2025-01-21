import {AccountAddress,U256} from "@aptos-labs/ts-sdk";
import { aptosClient } from "@/utils/aptosClient";
import { MODULE_ADDRESS } from "@/constants";
import { Address } from "cluster";

type ClaimHistoryParameters = {
    sponsor: string,
    roo: string,
    amount:string,
    fa_metadata: Object

}
//TODO: log this to see what is the actual return here...
export const getClaimAddress = async ({for_address}: {for_address: string}) =>{
    const result = await aptosClient().view<[Array<ClaimHistoryParameters>]>({
        payload: {
            function: `${AccountAddress.from(MODULE_ADDRESS)}::paydrop::get_claim_history`,
            functionArguments: [for_address]
        }
    })
    return result[0]
}