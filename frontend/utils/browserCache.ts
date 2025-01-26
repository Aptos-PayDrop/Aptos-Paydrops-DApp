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