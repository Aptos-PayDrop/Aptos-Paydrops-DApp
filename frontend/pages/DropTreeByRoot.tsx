import { Header } from "@/components/Header";
import { useToast } from "@/components/ui/use-toast";
import { ActionAlert, WarningAlert } from "@/components/ui/warning-alert";
import { PayDropsSpinner } from "@/components/UploadSpinner";
import { fetchMerkleTree, fetchTreeByRoot, getIrysURLFromId } from "@/utils/Irys";
import { query_fungible_asset_metadata } from "@/view-functions/graphql";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"
import { DetailsCard } from "./other/components/DetailsCard";
import { PayDropsTable } from "./other/components/PayDrops";
import { NETWORK } from "@/constants";
import { AccountAddress, Network } from "@aptos-labs/ts-sdk";
import { DropTreeDetails } from "@/view-functions/getDroptreeDetails";
import { Button } from "@/components/ui/button";
import { getIsNullified } from "@/view-functions/getIsNullified";
import { convertAmountFromHumanReadableToOnChain, convertAmountFromOnChainToHumanReadable } from "@/utils/helpers";
import { Spinner } from "@/components/ui/spinner";
import { refundDroptree } from "@/entry-functions/refund_droptree";
import { aptosClient } from "@/utils/aptosClient";
import { enablePaydrop } from "@/entry-functions/enable_paydrop";
import { claimDroptree } from "@/entry-functions/claim_paydrop";
import { convertStringTreeLayersToBigint, encodeForCircuit, generateMerkleProof, getMerkleRootFromMerkleProof } from "@/crypto/merkletree";
import { buildHashImplementation, computeProof, convertProofToVector, generateCommitmentHash, getSnarkArtifactsBrowserPath, hashAddressForSnark } from "@/crypto/utils";
import { newDroptree } from "@/entry-functions/new_droptree";
import Decimal from "decimal.js"


type DropTree = {
    creatorAddress: string,
    leaves: string[],
    root: string,
    tree: {
        layers: string[][]
    },
    addresses: string[],
    amounts: number[],
    nonce: string,
    decimals: number,
    fungible_asset_address: string
}


//If the root doesn't exists on chain but it can fetch by root fron Irys, then It should offer to create that tree and anyone can make the deposit!!
export function DropTreeByRoot() {
    const params = useParams();
    const navigate = useNavigate();
    const { account, signAndSubmitTransaction } = useWallet();
    const [dataInfo, setDataInfo] = useState({
        id: "",
        creatorAddress: "",
        tags: []
    })

    const [droptree, setTree] = useState<DropTree>({} as DropTree);

    const [notfound, setNotfound] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [amINullified, setAmINullified] = useState(true);
    const [treeContainsMyAddress, setTreeContainsMyAddress] = useState(false)
    const [amountIcanClaim, setAmountIcanClaim] = useState(0);
    const [dropTreeDetails, setDroptreeDetails] = useState<any>({});
    const [fungibleAssetDetails, setFungibleAssetDetails] = useState<any>({});
    const [existsOnChain, setExistsOnChain] = useState(false);
    const [disableOnCreateBtn, setDisableOnCreateBtn] = useState(false);

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

                const { contains, index } = containsMyAddressAtIndex(account?.address ?? "", fetchedTree.addresses);

                setTreeContainsMyAddress(contains);

                setAmountIcanClaim(fetchedTree.amounts[index])

                setTree({ ...fetchedTree, creatorAddress })

                //fetch fungible asset data
                const network = NETWORK === "testnet" ? Network.TESTNET : Network.MAINNET;

                const fungible_asset_address = fetchedTree.fungible_asset_address;
                const fa_data = await query_fungible_asset_metadata(network, fungible_asset_address);

                setFungibleAssetDetails(fa_data);

                setIsLoading(false);


                const dropTreeOnChainDetails = await DropTreeDetails({ sponsor: creatorAddress, root: BigInt(root) }).catch(err => {
                    toast_default("Not found", "Unable to fetch on-chain data. The deposit doesn't exist")
                });

                if (dropTreeOnChainDetails) {
                    setExistsOnChain(true);
                    setDroptreeDetails(dropTreeOnChainDetails);
                    console.log()
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
    }, [account])

    function containsMyAddressAtIndex(myAddress: string, addresses: Array<string>) {
        for (let i = 0; i < addresses.length; i++) {
            if (myAddress === addresses[i]) {
                return { contains: true, index: i }
            }
        }
        return {
            contains: false,
            index: 0
        }
    }


    function getExplorerLinkForFA(address: string) {
        return `https://explorer.aptoslabs.com/fungible_asset/${address}?network=${NETWORK}`
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

    async function onRefundClicked() {
        if (params.tree) {
            try {
                const inputTransaction = refundDroptree({
                    root: BigInt(params.tree)
                });

                const response = await signAndSubmitTransaction(inputTransaction);

                // Wait for the transaction to be committed
                const committedTransactionResponse = await aptosClient().waitForTransaction({
                    transactionHash: response.hash
                })

                //Refresh the page
                if (committedTransactionResponse.success) {
                    window.location.reload();
                }
            } catch (err: any) {
                toast_error(err.message)
            }
        }
    }

    function sumAmounts(amounts: number[]) {
        let sum = new Decimal(0);
        for (let i = 0; i < amounts.length; i++) {
            sum = sum.add(new Decimal(amounts[i]));
        }
        return sum.toNumber();
    }


    async function onCreate() {
        if (params.tree) {
            try {
                setDisableOnCreateBtn(true)
                const total_deposit = sumAmounts(droptree.amounts);
                const inputTransaction = newDroptree({
                    root: BigInt(params.tree),
                    fa_address: droptree.fungible_asset_address,
                    total_deposit,
                    total_deposit_decimals: droptree.decimals,
                    total_leaves: droptree.leaves.length,
                    enabled: true, // If you create it here it will be automatically enabled
                    url: getIrysURLFromId(dataInfo.id)
                });

                const response = await signAndSubmitTransaction(inputTransaction);

                const committedTransactionResponse = await aptosClient().waitForTransaction({
                    transactionHash: response.hash
                })
                //Reload the page
                if (committedTransactionResponse.success) {
                    window.location.reload();
                }
            } catch (err: any) {
                console.error(err.message);
                toast_error("An error occurred while processing the transaction")
            } finally {
                setDisableOnCreateBtn(false);
            }
        }
    }

    async function onEnableClicked() {
        if (params.tree) {
            try {
                const inputTransaction = enablePaydrop({ root: BigInt(params.tree) });
                const response = await signAndSubmitTransaction(inputTransaction);

                //Wait for the transaction to be committed
                const committedTransactionResponse = await aptosClient().waitForTransaction({
                    transactionHash: response.hash
                })
                if (committedTransactionResponse.success) {
                    window.location.reload();
                }
            } catch (err: any) {
                toast_error(err.message)
            }
        }
    }

    async function onClaimClicked() {
        if (params.tree && account) {
            try {
                await buildHashImplementation()
                const address = account.address;
                let amount = amountIcanClaim;
                let commitment = 0n;

                //Find the commitment in the list.. todo: this could be done earlier
                for (let i = 0; i < droptree.addresses.length; i++) {
                    if (droptree.addresses[i] === address) {
                        commitment = BigInt(droptree.leaves[i]);
                        break;
                    }
                }

                const nonce = BigInt(droptree.nonce);
                const bcsBytes = AccountAddress.from(address).bcsToBytes();
                const hashedAddress = await hashAddressForSnark(bcsBytes);

                const onChainAmount = convertAmountFromHumanReadableToOnChain(amount, droptree.decimals)
                const hashed_commitment = await generateCommitmentHash(hashedAddress, onChainAmount, nonce)
                if (hashed_commitment !== commitment) {
                    console.error("Unable to recover commitment")
                    toast_error("Error occured. Unable to recover commitment")
                    return
                }


                const convertedTree = convertStringTreeLayersToBigint(droptree.tree.layers);
                const bigintLeaves = droptree.leaves.map((leaf: string) => BigInt(leaf));

                const merkleProof = await generateMerkleProof(commitment, bigintLeaves, convertedTree)

                if (!merkleProof) {
                    //ERR it returned null
                    toast_error("Unable to create valid merkle proof")
                    return;
                }
                const merkleRoot = await getMerkleRootFromMerkleProof(merkleProof);

                if (BigInt(droptree.root) !== merkleRoot) {
                    //   /?Error the root was not recovered, the merkle proof is invalid...
                    console.error("Unable to create a valid merkle proof")
                    return;
                }
                // compute the proof
                const encodedProof = encodeForCircuit(merkleProof);


                const { wasmFilePath, zkeyFilePath } = getSnarkArtifactsBrowserPath()

                const { proof, publicSignals: _ } = await computeProof({
                    pathElements: encodedProof.pathElements,
                    pathIndices: encodedProof.pathIndices,
                    publicInputs: {
                        root: BigInt(droptree.root),
                        address: hashedAddress,
                        nonce,
                        amount: onChainAmount,
                    },
                    snarkArtifacts: {
                        wasmFilePath,
                        zkeyFilePath
                    }
                })
                const proof_vector = convertProofToVector(proof);

                const inputTransaction = claimDroptree({
                    sponsor: dataInfo.creatorAddress,
                    root: BigInt(droptree.root),
                    amount: amount,
                    amount_decimals: droptree.decimals,
                    nonce: BigInt(droptree.nonce),
                    proof: proof_vector
                });

                const response = await signAndSubmitTransaction(inputTransaction).catch((err) => {
                    toast_default("Interrupted", "Unable to sign and submit transaction");
                    console.log(err)
                });

                if (!response) {
                    return;
                }

                const committedTransactionResponse = await aptosClient().waitForTransaction({
                    transactionHash: response.hash
                })

                // //Refresh the page on success
                if (committedTransactionResponse.success) {
                    window.location.reload()
                }

            } catch (err: any) {
                console.error(err)
                toast_error("An error occured while processing the transaction")
            }
        }
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
                        This droptree does not exists on chain {account?.address === dataInfo.creatorAddress ? <Button onClick={onCreate} variant={"outline"}>Create it</Button> : undefined}
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
                    onEnableClicked={onEnableClicked}
                ></DetailsCard>
                <ShowRefundButton
                    creatorAddress={dataInfo.creatorAddress}
                    connectedAddress={account?.address}
                    deposit_left={dropTreeDetails.deposit_left}
                    enabled={dropTreeDetails.enabled}
                    onRefundClicked={onRefundClicked}
                ></ShowRefundButton>
                <ShowClaim
                    fa_symbol={fungibleAssetDetails.symbol}
                    claimAmount={amountIcanClaim}
                    addressCanClaim={treeContainsMyAddress}
                    addressNullified={amINullified}
                    treeEnabled={dropTreeDetails.enabled}
                    onClaimClicked={onClaimClicked}
                ></ShowClaim>
            </div>
        </div>
        {droptree?.root !== undefined ? <PayDropsTable droptree={droptree} /> :
            <div className="flex flex-row justify-center">
                <div className="flex flex-col justify-center">
                    <div className="flex flex-row justify-center">
                        <Spinner />
                    </div>
                    <p>Loading addresses. This may take a while</p>
                </div>
            </div>
        }
    </>
}


function ShowRefundButton(props: {
    creatorAddress: string,
    connectedAddress?: string,
    deposit_left: number,
    enabled: boolean,
    onRefundClicked: () => void
}) {

    const canWithdraw = props.creatorAddress === props.connectedAddress && props.deposit_left > 0 && props.enabled


    if (canWithdraw) {
        return <ActionAlert title="Refund">
            <p>You are the creator of this PayDrop so you may refund the remaining value any time. All future withdrawals will be canceled.</p>
            <Button onClick={props.onRefundClicked} variant={"green"}>Process Refund</Button>
        </ActionAlert>
    }
    return <div></div>
}


function ShowClaim(props: {
    claimAmount: number,
    fa_symbol: string,
    addressCanClaim: boolean,
    addressNullified: boolean,
    treeEnabled: boolean,
    onClaimClicked: () => void
}) {

    if (!props.addressCanClaim) {
        return <div></div>
    }

    if (props.addressCanClaim && !props.addressNullified && props.treeEnabled) {

        return <ActionAlert title="Claim Paydrop">
            <p>You are eligible to claim your share of this deposit. You can withdraw {props.claimAmount} {props.fa_symbol}</p>
            <Button onClick={props.onClaimClicked} variant={"green"}>Withdraw</Button>
        </ActionAlert>
    } else if (props.addressNullified && props.addressCanClaim && props.treeEnabled) {

        return <ActionAlert title="Paydrop Claimed">
            <p>You have already claimed your share of this paydrop!</p>
        </ActionAlert>
    }

    return <div></div>
}