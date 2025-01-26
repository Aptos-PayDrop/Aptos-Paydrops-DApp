import { WebUploader } from "@irys/web-upload";
import { WebAptos } from "@irys/web-upload-aptos";

import { NETWORK } from "@/constants";
import { WalletContextState } from "@aptos-labs/wallet-adapter-react";
import { getAccountAPTBalance } from "@/view-functions/getAccountAPTBalance";

const getIrys = async (aptosWallet: WalletContextState) => {
  // If dapp's network is testnet, use the devnet irys node, otherwise use the mainnet irys node
  const irysNode = NETWORK === "testnet" ? "devnet" : "mainnet";
  const irys = WebUploader(WebAptos).withProvider(aptosWallet).network(irysNode);
  // Irys requires to configure a rpc provider for the devnet node
  if (irysNode === "devnet") {
    irys.withRpc(NETWORK);
  }
  return await irys;
};

export const checkIfFund = async (aptosWallet: WalletContextState, fileSize: number) => {
  // 1. estimate the gas cost based on the data size https://docs.irys.xyz/developer-docs/irys-sdk/api/getPrice
  const webIrys = await getIrys(aptosWallet);
  const costToUpload = await webIrys.getPrice(fileSize);
  // 2. check the wallet balance on the irys node
  const irysBalance = await webIrys.getBalance();
  // 3. if balance is enough, then upload without funding
  if (irysBalance.toNumber() > costToUpload.toNumber()) {
    return true;
  }
  // 4. if balance is not enough,  check the payer balance
  const currentAccountAddress = await aptosWallet.account!.address;

  const currentAccountBalance = await getAccountAPTBalance({ accountAddress: currentAccountAddress });

  // 5. if payer balance > the amount based on the estimation, fund the irys node irys.fund, then upload
  if (currentAccountBalance > costToUpload.toNumber()) {
    try {
      await fundNode(aptosWallet, costToUpload.toNumber());
      return true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      throw new Error(`Error funding node ${error}`);
    }
  }
  // 6. if payer balance < the amount, replenish the payer balance*/
  return false;
};

export const fundNode = async (aptosWallet: WalletContextState, amount?: number) => {
  const webIrys = await getIrys(aptosWallet);

  try {
    const fundTx = await webIrys.fund(amount ?? 1000000);
    console.log(`Successfully funded ${webIrys.utils.fromAtomic(fundTx.quantity)} ${webIrys.token}`);
    return true;
  } catch (e) {
    throw new Error(`Error uploading data ${e}`);
  }
};

export const uploadFile = async (aptosWallet: WalletContextState, fileToUpload: File, tags: Array<{ name: string, value: string }>): Promise<string> => {
  const webIrys = await getIrys(aptosWallet);
  try {
    const receipt = await webIrys.uploadFile(fileToUpload, { tags });
    return `https://gateway.irys.xyz/${receipt.id}`;
  } catch (e) {
    throw new Error(`Error uploading file ${e}`);
  }
};


export async function fetchTreeByRoot(root: string,): Promise<{
  found: boolean,
  data: any,
  error: string
}> {
  try {
    const graphqlURL = NETWORK === "testnet" ? "https://devnet.irys.xyz/graphql" : "https://uploader.irys.xyz/graphql";
    // const graphqlURL = "https://uploader.irys.xyz/graphql"
    const query = `
  query getPaydrops($root: String!) {
	transactions(tags: [
		{ name: "App", values: ["Aptos-Paydrop"] },
		{name: "Root", values: [$root]}
		
		]) {
		edges {
			node {
				id
				address
			}
		}
	}
}
  `

    const variables = {
      root
    }

    const res = await fetch(graphqlURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query,
        variables
      })
    })

    const json = await res.json();
    const foundIt = json?.data?.transactions?.edges?.length !== 0;
    if (!foundIt) {
      return {
        found: false,
        error: "not found",
        data: {}
      }
    }
    const edge = json.data.transactions.edges[0];
    const address = edge.node.address;
    const id = edge.node.id;


    return {
      found: true,
      error: "",
      data: {
        address, id
      }
    }
  } catch (err: any) {
    return {
      found: false,
      error: err.message,
      data: {}
    }
  }
}

export async function fetchMerkleTree(id: string) {
  const dataURL = NETWORK === "testnet" ? `https://devnet.irys.xyz/${id}` : `https://uploader.irys.xyz/${id}`;

  const fetchedData = await fetch(dataURL, {
    method: "GET"
  });


  const json = await fetchedData.json();

  return json

}