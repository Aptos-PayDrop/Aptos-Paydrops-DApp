import {AccountAddress} from "@aptos-labs/ts-sdk";
import { aptosClient } from "@/utils/aptosClient";
import { MODULE_ADDRESS } from "@/constants";

type GetTotalTreesArg = {
    sponsor: string
}

export  const getTotalTrees = async ({sponsor}: GetTotalTreesArg) =>{
    const result = await aptosClient().view<[number]>({
        payload:{
            function: `${AccountAddress.from(MODULE_ADDRESS)}::paydrop::total_tree`,
            functionArguments: [sponsor]
        }
    });

    return result[0];
}