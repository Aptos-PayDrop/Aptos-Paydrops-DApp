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
import { UploadSpinner } from "@/components/UploadSpinner";
import { LabeledInput } from "@/components/ui/labeled-input";
import { ConfirmButton } from "@/components/ui/confirm-button";
// Internal utils
import { checkIfFund, uploadFile } from "@/utils/Irys";
import { aptosClient } from "@/utils/aptosClient";
// Internal constants
import { IS_PROD } from "@/constants";
// Entry functions
import { Header } from "@/components/Header";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { parseTextToCSV } from "@/lib/csv";
import { Progress, verifyAndBuildTree } from "@/lib/verifyAndBuildTree";
import { Fa_metadata, query_fungible_asset_metadata } from "@/view-functions/graphql";


const initialProgress = "Enter the Fungible Token address and select a CSV file with the addresses"

//TODO: add a mine merkle tree button
//TODO: show the Fungible Asset Details

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

  const [showComponent, set_showComponent] = useState(ShowComponent.MiningReady);

  const [miningEnabled, set_minginEnabled] = useState(false);

  const [fileVerifySuccess, setFileVerifySuccess] = useState(false);

  // Internal state
  const [isUploading, setIsUploading] = useState(false);

  const [uploadedFile, setUploadedFile] = useState<File | null>();

  const [parsedFile, setParsedFile] = useState([] as Array<Array<string>>);

  const [verifiedEntries, setVerifiedEntries] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);

  const [depositAmount, setDepositAmount] = useState(0);

  const [progressMessage, setProgressMessage] = useState({ progress: Progress.initalProgress, message: initialProgress });

  const [merkleTree, setMerkleTree] = useState({ root: undefined });

  const toast_error = (description: string) => {
    toast({
      variant: "destructive",
      title: "Error",
      description,
    });
  }

  // Local Ref
  const inputRef = useRef<HTMLInputElement>(null);

  const disableCreateAssetButton =
    !fa_address || !account || isUploading;


  async function handle_fa_metadata() {

    const validAddress = AccountAddress.isValid({ input: fa_address });

    if (!validAddress) {
      toast_error("Invalid Fungible Asset Address");
      setFa_metadata(FA_METADATA_DEFAULT)
      return;
    }

    const network = process.env.VITE_APP_NETWORK === "testnet" ? Network.TESTNET : Network.MAINNET;

    const data = await query_fungible_asset_metadata(network, fa_address).catch((err) => {
      toast_error("Unable to fetch Fungible Asset Metadata");
      setFa_metadata(FA_METADATA_DEFAULT);
      return FA_METADATA_DEFAULT;
    }).then((data) => data);


    setFa_metadata(data);
  }

  async function verifyingCSV(parsedCSV: Array<Array<string>>) {
    for (let i = 0; i < parsedCSV.length; i++) {
      let row = parsedCSV[i];
      //SO now Here I start validating and computing the commitments!
      let address = row[0] as string;
      let amount = row[1] as string;

      if (address === "" && amount === undefined) {
        continue;
      }


      const isValid = AccountAddress.isValid({ input: address });

      if (!isValid.valid) {
        toast_error(`Unable to parse. Invalid address found`);
        onProgress(Progress.error, "An error occured");
        return;
      }

      if (isNaN(parseFloat(amount))) {
        toast_error(`Unable to parse. Invalid amount found.`);
        onProgress(Progress.error, "An error occured");
        return;
      }

      setVerifiedEntries(i + 1);
    }
  }


  const onVerifyError = (reason: string) => {
    toast_error(reason)
  }

  const onVerifySuccess = (result: any) => { }

  const onProgress = (progress: Progress, message: string) => {
    if (progress === Progress.started) {
      console.log("progress started")
    }

    if (progress === Progress.error) {
      console.log("error")
    }

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
          toast_error("Unable to parse CSV")
          return;
        }

        console.log(data);
        setTotalEntries(data.length === 0 ? 0 : data.length - 1);

        verifyingCSV(data as Array<Array<string>>);

        setUploadedFile(file);
        setParsedFile(data as Array<Array<string>>);
        setFileVerifySuccess(true);
      }
    }
    reader.readAsText(file);
  }

  const mine_merkletree = async () => {

    console.log("mining merkle tree")


    if (parsedFile.length === 0) {
      toast_error("Invalid file");
      return;
    }

    if (fa_metadata.valid === false) {
      toast_error("Invalid Fungible Asset Metadata");
      return;
    }

    verifyAndBuildTree(parsedFile, fa_metadata.decimals, onVerifyError, onVerifySuccess, onProgress);
  }

  const createDropTree = async () => { }


  //TODO: compute the merkle tree
  //MAke sure the enered address is a a valid fungible asset
  //Deposit that fungible asset

  // // On create asset button clicked
  // const onCreateAsset = async () => {
  //   try {
  //     if (!account) throw new Error("Connect wallet first");

  //     // Set internal isUploading state
  //     setIsUploading(true);

  //     // Check an Irys node has funded
  //     const funded = await checkIfFund(aptosWallet, image.size);
  //     if (!funded) throw new Error("Current account balance is not enough to fund a decentralized asset node");

  //     // Upload asset file to Irys
  //     const iconURL = await uploadFile(aptosWallet, image);

  //     // Submit a create_fa entry function transaction
  //     const response = await signAndSubmitTransaction(
  //       createAsset({
  //         maxSupply: Number(maxSupply),
  //         name,
  //         symbol,
  //         decimal: Number(decimal),
  //         iconURL,
  //         projectURL,
  //         mintFeePerFA,
  //         mintForMyself,
  //         maxMintPerAccount,
  //       }),
  //     );

  //     // Wait for the transaction to be commited to chain
  //     const committedTransactionResponse = await aptosClient().waitForTransaction({
  //       transactionHash: response.hash,
  //     });

  //     // Once the transaction has been successfully commited to chain, navigate to the `my-assets` page
  //     if (committedTransactionResponse.success) {
  //       navigate(`/my-assets`, { replace: true });
  //     }
  //   } catch (error) {
  //     alert(error);
  //   } finally {
  //     setIsUploading(false);
  //   }
  // };

  //TODO: remove the wrong address crap
  //TODO: display the details of the merkle tree below
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



          <UploadSpinner on={isUploading} />

          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <LabeledInput

                id="fungible-asset-address"
                label="Fungible Asset Address"
                tooltip="The address of the Fungible Asset that will be deposited"
                required
                onChange={(e) => {
                  setFa_Address(e.target.value)
                }}
                disabled={isUploading || !account}
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
                  disabled={isUploading || !account || !wallet || isAptosConnectWallet(wallet)}
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
                          inputRef.current!.value = "";
                        }}
                      >
                        Clear
                      </Button>

                      Verified Entries: {verifiedEntries}/{totalEntries}

                    </p>
                  </>
                )}

              </div>
              <p className="text-gray-600 mt-5">Make sure your CSV has the following first two columns:</p>
              <CSVFormatExample></CSVFormatExample>
              <p className="text-gray-600">Each address will be able to withdraw only the specified amount. Duplicate addresses won't be able to withdraw twice.</p>

            </CardContent>

          </Card>

          <p className="text-gray-600">{progressMessage.message}</p>

          {/* <ConfirmButton
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
          /> */}
          <SwitchConfirmButtion
            createDropTree={createDropTree}
            disableCreateAssetButton={disableCreateAssetButton}
            show={showComponent}
            fa_metadata={fa_metadata}
            mine_merkletree={mine_merkletree}
            mining_enabled={fileVerifySuccess && fa_metadata.valid}

          ></SwitchConfirmButtion>
        </div>
      </div>
    </>
  );
}

enum ShowComponent {
  Confirm, MiningReady, MiningStarted, Default,
}

function SwitchConfirmButtion(props: {
  createDropTree: () => void,
  disableCreateAssetButton: boolean,
  show: ShowComponent,
  fa_metadata: Fa_metadata,
  mine_merkletree: () => void,
  mining_enabled: boolean
}) {

  switch (props.show) {
    case ShowComponent.Confirm:
      return <ConfirmButton
        title="Upload and Deposit Assets"
        className="self-start"
        onSubmit={props.createDropTree}
        disabled={props.disableCreateAssetButton}
        confirmMessage={
          <>
            <p>
              The upload process requires at least 1 message signatures to upload the Merkle Tree to Irys.
            </p>
            <p>In the case we need to fund a node on Irys, a transfer transaction submission is required also.</p>
          </>
        }
      />

    case ShowComponent.MiningReady:
      return <Button disabled={!props.mining_enabled} onClick={props.mine_merkletree} >Mine Merkle Tree</Button>

    case ShowComponent.MiningStarted:
      return <div></div>
    case ShowComponent.Default:
      return <div></div>
    default:
      return <div></div>
  }

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