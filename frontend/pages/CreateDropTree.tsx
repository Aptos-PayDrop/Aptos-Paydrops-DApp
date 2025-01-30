import { isAptosConnectWallet, useWallet } from "@aptos-labs/wallet-adapter-react";
import { AccountAddress, Network } from "@aptos-labs/ts-sdk";

import { Link, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
// Internal components
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WarningAlert } from "@/components/ui/warning-alert";
import { PayDropsSpinner } from "@/components/UploadSpinner";
import { LabeledInput } from "@/components/ui/labeled-input";
import { ConfirmButton } from "@/components/ui/confirm-button";
// Internal utils
import { checkIfFund, uploadFile } from "@/utils/Irys";
import { aptosClient } from "@/utils/aptosClient";
// Internal constants
import { IS_PROD, NETWORK } from "@/constants";
// Entry functions
import { Header } from "@/components/Header";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { parseTextToCSV } from "@/lib/csv";
import { Progress, verifyAndBuildTree } from "@/lib/verifyAndBuildTree";
import { query_fungible_asset_metadata } from "@/view-functions/graphql";
import { Progress as ProgressIndicator } from "@/components/ui/progress";
import { newDroptree } from "@/entry-functions/new_droptree";
import { Checkbox } from "@/components/ui/checkbox";


type MerkleTreeData = {
  addresses: string[],
  amounts: number[],
  decimals: number,
  leaves: bigint[],
  nonce: bigint,
  root: bigint | undefined,
  tree: bigint[][],
  fungible_asset_address: string
}


export function CreateDropTree() {
  // Wallet Adapter provider
  const aptosWallet = useWallet();
  const { toast } = useToast();

  const { account, wallet, signAndSubmitTransaction } = useWallet();

  // If we are on Production mode, redierct to the public mint page
  const navigate = useNavigate();
  if (IS_PROD) navigate("/", { replace: true });

  // Collection data entered by the user on UI
  const [fa_address, setFa_Address] = useState<string>("");

  const FA_METADATA_DEFAULT = { name: "", decimals: 0, symbol: "", token_standard: "", valid: false }

  const [fa_metadata, setFa_metadata] = useState(FA_METADATA_DEFAULT);

  const [amountToDeposit, setAmountToDeposit] = useState(0);

  const [feePercentage, setFeePercentage] = useState(0);

  const [miningProgess, setMiningProgress] = useState(0);

  const [miningEnabled, set_miningEnabled] = useState(true);

  const [miningStarted, setMiningStarted] = useState(false);

  const [fileVerifySuccess, setFileVerifySuccess] = useState(false);

  // Internal state

  const [isUploading, setIsUploading] = useState(false);

  const [uploadedFile, setUploadedFile] = useState<File | null>();

  const [parsedFile, setParsedFile] = useState([] as Array<Array<string>>);

  const [verifiedEntries, setVerifiedEntries] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);

  const [claimEnabled, setClaimEnabled] = useState(true);

  const defaultMerkleTree = {
    addresses: [],
    amounts: [],
    decimals: 0,
    leaves: [],
    nonce: 0n,
    root: undefined,
    tree: [],
    fungible_asset_address: ""
  }

  const [merkleTree, setMerkleTree] = useState<MerkleTreeData>(defaultMerkleTree);

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

  // Local Ref
  const inputRef = useRef<HTMLInputElement>(null);

  const disableCreateAssetButton =
    !fa_address || !account || merkleTree.root === undefined;

  async function handle_fa_metadata() {

    const validAddress = AccountAddress.isValid({ input: fa_address });

    if (!validAddress) {
      toast_error("Invalid Fungible Asset Address");
      setFa_metadata(FA_METADATA_DEFAULT)
      return;
    }
    const network = NETWORK === "testnet" ? Network.TESTNET : Network.MAINNET;

    const data = await query_fungible_asset_metadata(network, fa_address).catch((err) => {
      toast_error("Unable to fetch Fungible Asset Metadata");
      setFa_metadata(FA_METADATA_DEFAULT);
      return FA_METADATA_DEFAULT;
    }).then((data) => data);


    setFa_metadata(data);
  }

  async function verifyingCSV(parsedCSV: Array<Array<string>>) {
    let amountSum = 0;
    for (let i = 0; i < parsedCSV.length - 1; i++) {
      let row = parsedCSV[i];
      //SO now Here I start validating and computing the commitments!
      let address = row[0] as string;
      let amount = row[1] as string;

      const isValid = AccountAddress.isValid({ input: address });

      if (!isValid.valid) {
        toast_error(`Unable to parse. Invalid address found`);
        return;
      }

      if (isNaN(parseFloat(amount))) {
        toast_error(`Unable to parse. Invalid amount found.`);
        return;
      }

      setVerifiedEntries(i + 1);
      amountSum += parseFloat(amount);
    }
    setAmountToDeposit(amountSum);
  }


  const onVerifyError = (reason: string) => {
    toast_error(reason)
  }

  const onMiningSuccess = (result: any) => {
    set_miningEnabled(false);
    setMerkleTree(result);
    console.log(result);
    console.log("HEEERE")

    setMiningStarted(false);
  }

  const onProgress = (progress: Progress, message: string, completed: number) => {

    if (progress === Progress.error) {

      toast_error("Failed to generate Merkle Tree");
      setMiningProgress(0)
      setMiningStarted(false);
      return;
    }

    setMiningProgress(completed);
    setMiningStarted(false);

  }

  const verifyUploadedFile = (file: File) => {
    setVerifiedEntries(0);
    setTotalEntries(0);
    setFileVerifySuccess(false);
    console.log("verify started");
    if (file.type !== "text/csv") {

      toast_error("Invalid File Format. Must be CSV")
      return;
    }

    let reader = new FileReader();

    reader.onload = async function (e) {
      console.log("reading file")
      if (e.target?.result) {


        const [data, errors] = parseTextToCSV(
          e.target.result as string);

        if (errors.length !== 0) {
          console.log(errors)
          // toast_error("Errors detected in the file ")
        }

        setTotalEntries(data.length === 0 ? 0 : data.length - 1);

        verifyingCSV(data as Array<Array<string>>);

        setUploadedFile(file);
        setParsedFile(data as Array<Array<string>>);
        setFileVerifySuccess(true);
        set_miningEnabled(true);
      }
    }
    reader.readAsText(file);
  }

  const mine_merkletree = async () => {
    setMiningProgress(0);
    console.log("mining merkle tree")
    onProgress(Progress.miningstart, "Computing Commitments", 20);

    if (parsedFile.length === 0) {
      toast_error("Invalid file");
      return;
    }

    if (fa_metadata.valid === false) {
      toast_error("Invalid Fungible Asset Metadata");
      return;
    }

    verifyAndBuildTree(parsedFile, fa_metadata.decimals, onVerifyError, onMiningSuccess, onProgress);
  }

  const createDropTree = async () => {
    try {
      const merkleTreeData: MerkleTreeData = { ...merkleTree, fungible_asset_address: fa_address }
      const serializedMerkleTreeData = JSON.stringify(merkleTreeData, (_, v) => typeof v === "bigint" ? v.toString() : v);

      const merkleTreeBlob = new Blob([serializedMerkleTreeData], {
        type: "application/json"
      })


      if (!account) throw new Error("Connect wallet first");

      setIsUploading(true);


      // Check an Irys node has funded
      const funded = await checkIfFund(aptosWallet, merkleTreeBlob.size);
      if (!funded) throw new Error("Current account balance is not enough to fund a decentralized asset node");

      //Upload merkle tree to Irys, I will add some tags to search with
      const treeFile = new File([merkleTreeBlob], "merkletree.json", { type: "application/json" });
      const tags: Array<{ name: string, value: string }> = [
        { name: "Content-Type", value: "application/json" },
        { name: "App", value: "Aptos-Paydrop" },
        { name: "Root", value: (merkleTreeData.root as bigint).toString() },
        { name: "Sponsor", value: account.address },
        { name: "Leaves", value: `${merkleTreeData.leaves.length}` },
        { name: "Fungible-Asset-Address", value: fa_address },
        { name: "Fungible-Asset-Name", value: fa_metadata.name },
        { name: "Total-Deposit", value: amountToDeposit.toString() },
        { name: "Decimals", value: fa_metadata.decimals.toString() }
      ]
      const merkleTreeUrl = await uploadFile(aptosWallet, treeFile, tags);
      console.log(merkleTreeUrl)
      // //Submit the create_dropTree entry transaction
      const inputTransaction = newDroptree({
        root: merkleTreeData.root as bigint,
        fa_address: merkleTreeData.fungible_asset_address,
        total_deposit: amountToDeposit,
        total_deposit_decimals: fa_metadata.decimals,
        total_leaves: merkleTreeData.leaves.length,
        enabled: claimEnabled,
        url: merkleTreeUrl
      })

      const response = await signAndSubmitTransaction(
        inputTransaction
      );
      //      wait for the transaction to be committed on chain

      const committedTransactionResponse = await aptosClient().waitForTransaction({
        transactionHash: response.hash,
      });

      //Go to history and it should show you crating an new droptree
      if (committedTransactionResponse.success) {
        navigate(`/history`, { replace: true });
      }

    } catch (err: any) {
      toast_error(err.message);
    } finally {
      setIsUploading(false);

    }
  }

  return (
    <>
      <Header title="Fund Paydrops" />
      <div className="flex flex-col md:flex-row items-start justify-between px-4 py-2 gap-4 max-w-screen-xl mx-auto">
        <div className="w-full md:w-2/3 flex flex-col gap-y-4 order-2 md:order-1">
          {(!account) && (
            <WarningAlert title={account ? "Wrong account connected" : "No account connected"}>
              To continue uploading the payment information, connect your wallet

            </WarningAlert>
          )}


          {wallet && isAptosConnectWallet(wallet) && (
            <WarningAlert title="Wallet not supported">
              Google account is not supported when funding Paydrops. Please select another wallet.
            </WarningAlert>
          )}

          <PayDropsSpinner on={isUploading} />

          <Card>


            <CardHeader>
              <CardTitle className="flex flex-row justify-between">
                Payment Details {account ? <Link className={buttonVariants({ variant: "outline" })} to="/droptree-history">Go to History</Link> : null}
              </CardTitle>
              <LabeledInput
                value={fa_address}
                id="fungible-asset-address"
                label="Fungible Asset Address"
                tooltip="The address of the Fungible Asset that will be deposited"
                required
                onChange={(e) => {
                  setFa_Address(e.target.value)
                }}
                disabled={!account}
                type="text"
              />
              <Button onClick={() => {
                handle_fa_metadata()
              }} className="w-48">Fetch Asset Metadata</Button>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell>name</TableCell>
                    <TableCell>decimals</TableCell>
                    <TableCell>symbol</TableCell>
                    <TableCell>token_standard</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{fa_metadata.name}</TableCell>
                    <TableCell>{fa_metadata.decimals === 0 ? "" : fa_metadata.decimals}</TableCell>
                    <TableCell>{fa_metadata.symbol}</TableCell>
                    <TableCell>{fa_metadata.token_standard}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <CardDescription>Import a CSV with the payment addresses and amounts and compute a Merkle Tree to upload to decentralized Storage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-start justify-between">
                {!uploadedFile && (
                  <Label
                    htmlFor="upload"
                    className={buttonVariants({
                      variant: "outline",
                      className: "cursor-pointer",
                    })}
                  >
                    Choose CSV file
                  </Label>
                )}
                <Input
                  disabled={!account || !wallet || isAptosConnectWallet(wallet)}
                  type="file"
                  className="hidden"
                  ref={inputRef}
                  id="upload"
                  placeholder="Upload Image"
                  onChange={(e) => {
                    if (e.target.files?.length !== 1) {
                      toast_error("You can only select 1 file");
                      return;
                    }
                    verifyUploadedFile(e.target.files![0])
                  }}
                />

                {uploadedFile && (
                  <>
                    <p className="body-sm">
                      <Button
                        variant="link"
                        className="text-destructive"
                        onClick={() => {
                          setUploadedFile(null)
                          setParsedFile([]);
                          setAmountToDeposit(0);
                          setMiningProgress(0);

                          inputRef.current!.value = "";
                        }}
                      >
                        Clear
                      </Button>

                      Verified Entries: {verifiedEntries}/{totalEntries}

                      <Button onClick={async () => {
                        setMiningStarted(true);
                        toast_default("Mining started", "You need to mine the merkle tree, this may take a few moments")

                        await mine_merkletree()
                      }} variant="secondary" disabled={verifiedEntries !== totalEntries || !miningEnabled}>Mine Merkle Tree</Button>
                    </p>
                  </>
                )}
              </div>
              <div className="mt-2"></div>
              <ProgressIndicator value={miningProgess}></ProgressIndicator>
              <p className="text-gray-600 mt-5">Make sure your CSV has the following first two columns:</p>
              <CSVFormatExample></CSVFormatExample>
              <p className="text-gray-600">Each address will be able to withdraw only the specified amount. Duplicate addresses won't be able to withdraw twice.</p>

            </CardContent>

          </Card>

          <p className="text-gray-600">Amount to deposit: <strong>{amountToDeposit} {fa_metadata.symbol}</strong> </p>
          <Label tooltip="You can enable the withdrawals from the deposit now or do it later manually">Enable withdrawals: <Checkbox className="checkbox" checked={claimEnabled} onCheckedChange={(to: boolean) => { setClaimEnabled(to) }}></Checkbox></Label>
          <ConfirmButton
            title="Upload and Deposit Assets"
            className="self-start"
            onSubmit={createDropTree}
            disabled={disableCreateAssetButton}
            confirmMessage={
              <>
                <p>
                  The upload process requires at least 1 message signatures to upload the Merkle Tree to Irys.
                </p>
                <p>In the case we need to fund a node on Irys, a transfer transaction submission is required also.</p>
              </>
            }
          />

        </div>
      </div>
    </>
  );
}


function CSVFormatExample() {
  return <div className="rounded-md max-w-52 slate-grey-200">
    <Table>
      <TableHeader>
        <TableRow>
          <TableCell>address</TableCell>
          <TableCell>amount</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>0x....</TableCell>
          <TableCell>...</TableCell>
        </TableRow>
      </TableBody>
    </Table></div>
}