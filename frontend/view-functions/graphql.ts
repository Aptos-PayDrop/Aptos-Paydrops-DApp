import { getFungibleAssetMetadata, setFungibleAssetMetadata } from "@/utils/browserCache";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";


export type Fa_metadata = {
    name: string,
    decimals: number,
    symbol: string,
    token_standard: string,
    valid: boolean

}
export async function query_fungible_asset_metadata(network: Network, address: string): Promise<Fa_metadata> {
    const getCache = await getFungibleAssetMetadata(network, address);

    if (getCache.success) {
        return {
            ...getCache.data as Fa_metadata,
            valid: true
        };
    }

    const aptosConfig = new AptosConfig({ network });
    const aptos = new Aptos(aptosConfig);


    const query = `
      query GetFungibleAssetInfo($addr: String) {
        fungible_asset_metadata(
           where: {asset_type: {_eq: \"${address}\"}}
        ) {
           name
           decimals
           symbol
           token_standard
      }
    }
    `

    const fa_asset: any = await aptos.queryIndexer({
        query: {
            query
        }
    })


    const result = {
        name: fa_asset.fungible_asset_metadata[0].name,
        decimals: fa_asset.fungible_asset_metadata[0].decimals,
        symbol: fa_asset.fungible_asset_metadata[0].symbol,
        token_standard: fa_asset.fungible_asset_metadata[0].token_standard,
        valid: true
    }

    await setFungibleAssetMetadata(network, address, result)
    return result
}
