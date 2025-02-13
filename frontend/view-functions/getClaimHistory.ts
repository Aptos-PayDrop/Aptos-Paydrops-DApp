import {AccountAddress} from "@aptos-labs/ts-sdk";
import { aptosClient } from "@/utils/aptosClient";
import { MODULE_ADDRESS } from "@/constants";

type ClaimHistoryParameters = {
    sponsor: string,
    roo: string,
    amount:string,
    fa_metadata: {inner: string}

}
export const getClaimHistory = async ({for_address}: {for_address: string}) =>{
    const result = await aptosClient().view<[Array<ClaimHistoryParameters>]>({
        payload: {
            function: `${AccountAddress.from(MODULE_ADDRESS)}::paydrop::get_claim_history`,
            functionArguments: [for_address]
        }
    })
    return result[0]
}