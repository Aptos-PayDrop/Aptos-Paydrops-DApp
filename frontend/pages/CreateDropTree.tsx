import { isAptosConnectWallet, useWallet } from "@aptos-labs/wallet-adapter-react";
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
import {  IS_PROD } from "@/constants";
// Entry functions
import { createAsset } from "@/entry-functions/create_asset";
import { Header } from "@/components/Header";

export function CreateDropTree() {
  // Wallet Adapter provider
  const aptosWallet = useWallet();
  const { account, wallet, signAndSubmitTransaction } = useWallet();

  // If we are on Production mode, redierct to the public mint page
  const navigate = useNavigate();
  if (IS_PROD) navigate("/", { replace: true });

  // Collection data entered by the user on UI
  const [name, setName] = useState<string>("");
  const [symbol, setSymbol] = useState<string>("");
  const [maxSupply, setMaxSupply] = useState<string>();
  const [maxMintPerAccount, setMaxMintPerAccount] = useState<number>();
  const [decimal, setDecimal] = useState<string>();
  const [image, setImage] = useState<File | null>(null);
  const [projectURL, setProjectURL] = useState<string>("");
  const [mintFeePerFA, setMintFeePerFA] = useState<number>();
  const [mintForMyself, setMintForMyself] = useState<number>();

  // Internal state
  const [isUploading, setIsUploading] = useState(false);

  // Local Ref
  const inputRef = useRef<HTMLInputElement>(null);

  const disableCreateAssetButton =
    !name || !symbol || !maxSupply || !decimal || !projectURL || !maxMintPerAccount || !account || isUploading;

  // On create asset button clicked
  const onCreateAsset = async () => {
    try {
      if (!account) throw new Error("Connect wallet first");
      if (!image) throw new Error("Select image first");

      // Set internal isUploading state
      setIsUploading(true);

      // Check an Irys node has funded
      const funded = await checkIfFund(aptosWallet, image.size);
      if (!funded) throw new Error("Current account balance is not enough to fund a decentralized asset node");

      // Upload asset file to Irys
      const iconURL = await uploadFile(aptosWallet, image);

      // Submit a create_fa entry function transaction
      const response = await signAndSubmitTransaction(
        createAsset({
          maxSupply: Number(maxSupply),
          name,
          symbol,
          decimal: Number(decimal),
          iconURL,
          projectURL,
          mintFeePerFA,
          mintForMyself,
          maxMintPerAccount,
        }),
      );

      // Wait for the transaction to be commited to chain
      const committedTransactionResponse = await aptosClient().waitForTransaction({
        transactionHash: response.hash,
      });

      // Once the transaction has been successfully commited to chain, navigate to the `my-assets` page
      if (committedTransactionResponse.success) {
        navigate(`/my-assets`, { replace: true });
      }
    } catch (error) {
      alert(error);
    } finally {
      setIsUploading(false);
    }
  };
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
              <CardDescription>Imports a CSV with the payment addresses and uploads a Merkle Tree to decentralized Storage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-start justify-between">
                {!image && (
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
                    setImage(e.target.files![0]);
                  }}
                />
                {image && (
                  <>
                    <img src={URL.createObjectURL(image)} />
                    <p className="body-sm">
                      {image.name}
                      <Button
                        variant="link"
                        className="text-destructive"
                        onClick={() => {
                          setImage(null);
                          inputRef.current!.value = "";
                        }}
                      >
                        Clear
                      </Button>
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
           <LabeledInput
            id="asset-name"
            label="Fungible Asset Address"
            tooltip="The address of the Fungible Asset that will be deposited"
            required
            onChange={(e) => setName(e.target.value)}
            disabled={isUploading || !account}
            type="text"
          />

          <ConfirmButton
            title="Deposit Assets"
            className="self-start"
            onSubmit={onCreateAsset}
            disabled={disableCreateAssetButton}
            confirmMessage={
              <>
                <p>
                  The upload process requires at least 1 message signatures to upload the asset image file into Irys.
                </p>
                <p>In the case we need to fund a node on Irys, a transfer transaction submission is required also.</p>
              </>
            }
          />
        </div>

        <div className="w-full md:w-1/3 order-1 md:order-2">
          <Card>
            <CardHeader className="body-md-semibold">Learn More</CardHeader>
            <CardContent>
              <Link
                to="https://aptos.dev/standards/fungible-asset"
                style={{ textDecoration: "underline" }}
                target="_blank"
              >
                Find out more about Fungible Assets on Aptos
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
