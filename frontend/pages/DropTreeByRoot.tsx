import { Header } from "@/components/Header";
import { useToast } from "@/components/ui/use-toast";
import { ActionAlert, WarningAlert } from "@/components/ui/warning-alert";
import { PayDropsSpinner } from "@/components/UploadSpinner";
import { fetchMerkleTree, fetchTreeByRoot } from "@/utils/Irys";
import { query_fungible_asset_metadata } from "@/view-functions/graphql";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"
import { DetailsCard } from "./other/components/DetailsCard";
import { PayDropsTable } from "./other/components/PayDrops";
import { IS_PROD, NETWORK } from "@/constants";
import { Network } from "@aptos-labs/ts-sdk";
import { DropTreeDetails } from "@/view-functions/getDroptreeDetails";
import { Button } from "@/components/ui/button";
import { getIsNullified } from "@/view-functions/getIsNullified";
import { convertAmountFromOnChainToHumanReadable } from "@/utils/helpers";

//If the root doesn't exists on chain but it can fetch by root fron Irys, then It should offer to create that tree and anyone can make the deposit!!
export function DropTreeByRoot() {
    const params = useParams();
    const navigate = useNavigate();
    const { account, wallet } = useWallet();
    const [dataInfo, setDataInfo] = useState({
        id: "",
        creatorAddress: "",
        tags: []
    })

    const [droptree, setTree] = useState<any>({})

    const [notfound, setNotfound] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [nullifiedAddresses, setNullifiedAddresses] = useState<any>([]);
    const [amINullified, setAmINullified] = useState(true);
    const [treeContainsMyAddress, setTreeContainsMyAddress] = useState(false)
    const [dropTreeDetails, setDroptreeDetails] = useState<any>({});
    const [fungibleAssetDetails, setFungibleAssetDetails] = useState<any>({});
    const [existsOnChain, setExistsOnChain] = useState(false);


    const { toast } = useToast();

    const toast_error = (description: string) => {
        toast({
            variant: "destructive",
            title: "Error",
            description,
        });
    }

    const toast_default = (title: string, description: string) => {
        toast({
            variant: "default",
            title,
            description
        })
    }



    useEffect(() => {
        if (params.tree === "") {
            navigate("/", { replace: true })
        }

    }, [params])

    const fetchIrysGraphQlData = async () => {
        // setIsLoading(true);
        try {
            if (!params.tree) {

                return;
            }
            const root = params.tree;

            const results = await fetchTreeByRoot(root);

            if (results.found) {
                const creatorAddress = results.data.address;
                const id = results.data.id;
                const tags = results.data.tags;
                setDataInfo({
                    id,
                    creatorAddress,
                    tags
                })

                const fetchedTree = await fetchMerkleTree(id).catch((err) => {
                    toast_error("Failed to fetch merkle tree")
                })

                setTreeContainsMyAddress(containsMyAddress(account?.address ?? "", fetchedTree.addresses));

                setTree({ ...fetchedTree, creatorAddress })

                //fetch fungible asset data
                const network = NETWORK === "testnet" ? Network.TESTNET : Network.MAINNET;

                const fungible_asset_address = fetchedTree.fungible_asset_address;
                const fa_data = await query_fungible_asset_metadata(network, fungible_asset_address);

                setFungibleAssetDetails(fa_data);

                setIsLoading(false);


                const dropTreeOnChainDetails = await DropTreeDetails({ sponsor: creatorAddress, root: BigInt(root) }).catch(err => {
                    toast_default("Not found", "Unable to fetch on-chain data. The Tree doesn't exist")
                });
                if (dropTreeOnChainDetails) {
                    setExistsOnChain(true);
                    setDroptreeDetails(dropTreeOnChainDetails);

                    const isNullified = await getIsNullified({ sponsor: creatorAddress, root: BigInt(root), recipient: account?.address });
                    setAmINullified(isNullified)

                }


            } else {
                //NOT FOUND     
                toast_default("not found", "not found")
                setNotfound(true)
                setIsLoading(false)
            }
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        fetchIrysGraphQlData()
    }, [])

    if (!account) {
        console.log("no account connected")
    }

    function containsMyAddress(myAddress: string, addresses: Array<string>) {
        return addresses.includes(myAddress);
    }


    function getExplorerLinkForFA(address: string) {

        const url = `https://explorer.aptoslabs.com/fungible_asset/${address}?network=${NETWORK}`
        return url;
    }


    function getAmountToDepositIfNotExists(tags: any) {

        let totalDeposit = 0;

        for (let i = 0; i < tags.length; i++) {

            if (tags[i].name === "Total-Deposit") {
                totalDeposit = tags[i].value;
            }
        }

        return `${totalDeposit}`
    }

    return <>
        <Header title="PayDrops" />
        <div className="flex flex-col md:flex-row items-start justify-between px-4 py-2 gap-4 max-w-screen-xl mx-auto">
            <div className="w-full md:w-2/3 flex flex-col gap-y-4 order-2 md:order-1">
                {(!account) && (
                    <WarningAlert title={account ? "Wrong account connected" : "No account connected"}>
                        To interact with the contract and information related to your account, connect your wallet!
                    </WarningAlert>
                )}
                {(!existsOnChain) && (
                    <WarningAlert title={account ? "Not found on-chain" : "Missing smart contract data"}>
                        This droptree does not exists on chain {account?.address === dataInfo.creatorAddress ? <Button variant={"outline"}>Create it</Button> : undefined}
                    </WarningAlert>
                )}
                <PayDropsSpinner on={isLoading} />
                {notfound ? <div>Not found</div> : null}

                <DetailsCard
                    existsOnChain={existsOnChain}
                    root={params.tree ?? ""}
                    creatorAddress={dataInfo.creatorAddress}
                    amountToDepositIfNotExists={getAmountToDepositIfNotExists(dataInfo.tags) + ` ${fungibleAssetDetails.symbol ?? ""}`}
                    depositedAmount={convertAmountFromOnChainToHumanReadable(dropTreeDetails.total_deposit, droptree.decimals)}
                    faName={fungibleAssetDetails.symbol}
                    showEnable={account?.address === dataInfo.creatorAddress && !dropTreeDetails.enabled}
                    amountLeft={convertAmountFromOnChainToHumanReadable(dropTreeDetails.deposit_left, droptree.decimals)}
                    unusedLeaves={dropTreeDetails.unused_leaves}
                    totalLeaves={dropTreeDetails.total_leaves}
                    assetExplorerLink={getExplorerLinkForFA(droptree.fungible_asset_address)}
                ></DetailsCard>
                <ShowRefundButton
                    creatorAddress={dataInfo.creatorAddress}
                    connectedAddress={account?.address}
                    deposit_left={dropTreeDetails.deposit_left}
                    enabled={dropTreeDetails.enabled}
                ></ShowRefundButton>
                <ShowClaim
                    fa_symbol="stx"
                    claimAmount="10"
                    addressCanClaim={treeContainsMyAddress}
                    addressNullified={amINullified}
                    treeEnabled={dropTreeDetails.enabled}
                ></ShowClaim>
            </div>
        </div>
        {droptree?.root !== undefined ? <PayDropsTable droptree={droptree} nullifiedAddresses={nullifiedAddresses} /> : null}
    </>
}


function ShowRefundButton(props: {
    creatorAddress: string,
    connectedAddress?: string,
    deposit_left: number,
    enabled: boolean
}) {

    const canWithdraw = props.creatorAddress === props.connectedAddress && props.deposit_left > 0 && props.enabled


    if (canWithdraw) {
        return <ActionAlert title="Refund">
            <p>You are the creator of this PayDrop so you may refund the remaining value any time. All future withdrawals will be canceled.</p>
            <Button variant={"green"}>Process Refund</Button>
        </ActionAlert>
    }
    return <div></div>
}

function ShowClaim(props: {
    claimAmount: string,
    fa_symbol: string,
    addressCanClaim: boolean,
    addressNullified: boolean,
    treeEnabled: boolean
}) {

    if (!props.addressCanClaim) {
        return <div></div>
    }

    if (props.addressCanClaim && !props.addressNullified && props.treeEnabled) {

        return <ActionAlert title="Claim Paydrop">
            <p>You are eligible to claim your share of this deposit. You can withdraw {props.claimAmount} {props.fa_symbol}</p>
            <Button variant={"green"}>Withdraw</Button>
        </ActionAlert>
    } else if (props.addressNullified && props.addressCanClaim && props.treeEnabled) {

        return <ActionAlert title="Paydrop Claimed">
            <p>You have already claimed your share of this paydrop!</p>
        </ActionAlert>
    }

    return <div></div>
}