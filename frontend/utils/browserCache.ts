import { Fa_metadata } from '@/view-functions/graphql';
import { Network } from '@aptos-labs/ts-sdk';
import {
    set,
    get
} from 'idb-keyval';


export async function setTree(root: string, treeData: any): Promise<{ success: boolean, error: string }> {
    try {
        await set(root, treeData);
        return {
            success: true,
            error: ""
        }
    } catch (err) {
        return {
            success: false,
            error: "Unable to set"
        }
    }
}

export async function getTree(root: string): Promise<{ success: boolean, data: any, error: string }> {
    try {

        const res = await get(root);

        if (res) {
            return {
                success: true,
                error: "",
                data: res
            }
        }
        return {
            success: false,
            error: "not found",
            data: {}
        }

    } catch (err) {
        return {
            success: false,
            error: "threw error",
            data: {}
        }

    }
}

export type SetResult = {
    success: boolean, error: string
}

export type GetResult<T> = {
    success: boolean, error: string, data: T
}


export async function setFungibleAssetMetadata(network: Network, address: string, faMetadata: Fa_metadata): Promise<SetResult> {
    try {
        const key = `${network.toString()}-${address}`
        console.log(key)
        await set(key, faMetadata)
        return {
            success: true,
            error: ""
        }
    } catch (err: any) {
        return {
            success: false,
            error: err.message
        }
    }
}


export async function getFungibleAssetMetadata(network: Network, address: string): Promise<GetResult<Fa_metadata | {}>> {
    try {
        const key = `${network.toString()}-${address}`
        console.log(key)
        const res = await get(key);

        if (res) {
            return {
                success: true,
                error: "",
                data: res
            }
        }
        return {
            success: false,
            error: "not found",
            data: {}
        }
    } catch (err) {
        return {
            success: false,
            error: "threw error",
            data: {}
        }
    }
}