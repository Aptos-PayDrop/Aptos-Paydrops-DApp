import {AccountAddress, U64} from "@aptos-labs/ts-sdk";
import { aptosClient } from "@/utils/aptosClient";
import { MODULE_ADDRESS } from "@/constants";
import { convertAmountFromHumanReadableToOnChain } from "@/utils/helpers";


//Need to fetch the asset metadata to get the decimals before I can call this function with the amount
export const getCalulateFee = async({amount,decimals}: {amount: number,decimals: number}) =>{
    const result = await aptosClient().view<[string]>({
        payload: {
            function: `${AccountAddress.from(MODULE_ADDRESS)}::paydrop::calculate_fees`,
            functionArguments: [convertAmountFromHumanReadableToOnChain(amount,decimals)]
        }
    })
    return BigInt(result[0])
}