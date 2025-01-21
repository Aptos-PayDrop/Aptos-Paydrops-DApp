import {AccountAddress, U64} from "@aptos-labs/ts-sdk";
import { aptosClient } from "@/utils/aptosClient";
import { MODULE_ADDRESS } from "@/constants";

export const getCalulateFee = async({amount}: {amount: bigint}) =>{
    const result = await aptosClient().view<[string]>({
        payload: {
            function: `${AccountAddress.from(MODULE_ADDRESS)}::paydrop::calculate_fees`,
            functionArguments: [new U64(amount)]
        }
    })
    return BigInt(result[0])
}