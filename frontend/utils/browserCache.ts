import { Fa_metadata } from '@/view-functions/graphql';
import { Network } from '@aptos-labs/ts-sdk';
import {
    set,
    get
} from 'idb-keyval';


export async function setTreeCache(network: string, id: string, treeData: any): Promise<{ success: boolean, error: string }> {
    try {
        const key = `${network}-${id}-tree`

        await set(key, treeData);
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

export async function getTreeCache(network: string, id: string): Promise<{ success: boolean, data: any, error: string }> {
    try {
        const key = `${network}-${id}-tree`

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

export type SetResult = {
    success: boolean, error: string
}

export type GetResult<T> = {
    success: boolean, error: string, data: T
}


export async function setFungibleAssetMetadata(network: Network, address: string, faMetadata: Fa_metadata): Promise<SetResult> {
    try {
        const key = `${network.toString()}-${address}-assetmeta`
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
        const key = `${network.toString()}-${address}-assetmeta`
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

export async function setIrysTreeTxsByRootCache(network: string, root: string, node: any) {
    try {
        const key = `${network}-${root}-rootcache`
        await set(key, node)
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

export async function getIrysTreeTxsByRootCache(network: string, root: string) {
    try {
        const key = `${network}-${root}-rootcache`
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

export async function setUploadSuccessful(network: string, root: string, data: any) {
    try {
        const key = `${network}-${root}-uploadSuccess`
        await set(key, data)
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

export async function getUploadSuccessful(network: string, root: string) {
    try {
        const key = `${network}-${root}-uploadSuccess`
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