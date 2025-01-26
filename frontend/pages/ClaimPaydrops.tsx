import { Header } from "@/components/Header";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState } from "react";
import { LabeledInput } from "@/components/ui/labeled-input";
import { WarningAlert } from "@/components/ui/warning-alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { fetchMerkleTree, fetchTreeByRoot } from "@/utils/Irys";
import { getTree, setTree } from "@/utils/browserCache";
import { PayDropsSpinner, UploadSpinner } from "@/components/UploadSpinner";
import { useToast } from "@/components/ui/use-toast";
import { PayDropsTable } from "./Mint/components/PayDrops";

export function ClaimPaydrops() {

  const [root, setRoot] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [disableInput, setDisableInput] = useState(false);
  const [droptree, setDropTree] = useState<any>({root: undefined});

  // const { account } = useWallet();
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


  async function findDropTreeByRoot() {
    try {
      BigInt(root)
    } catch (err) {
      toast_error("Invalid root format")
      return;
    }


    const cachedTree = await getTree(root);

    if (cachedTree.success) {
      setDropTree(cachedTree.data);
      setIsLoading(false);
      return;
    }


    //If not then do the fetch...
    const searchForTree = await fetchTreeByRoot(root);
    if (!searchForTree.found) {

      if (searchForTree.error === "not found") {
        //TODO: this means the request was successful but not found
        toast_default("Not found", "The searched identifier does not exist!")
        return;
      }
      //else Network error
      toast_error("Unable to fetch data. Network error");
      return;
    }

    toast_default("Please wait", "Paydrops found! Processing...")
    setDisableInput(true);

    //Disable the input and button while processing, this is needed because large trees take time
    setIsLoading(true)
    // fetch merkle tree now
    const fetchedMerkleTree = await fetchMerkleTree(searchForTree.data.id).catch((err) => {
      toast_error("Failed to fetch merkle tree")
      setDisableInput(false);
      console.log(err);
      setIsLoading(false);
    });


    const droptree = { ...fetchedMerkleTree, creatorAddress: searchForTree.data.address }

    //Cache the merkle tree in the browser so I don't need to fetch it anymore
    setTree(root, droptree);
    //Navigate to the tree page 
    setDropTree(droptree)
    console.log(droptree)

    setIsLoading(false);
    setDisableInput(false);
  }

  return (
    <>
      <Header title="Claim Paydrops" />
      <div className="flex flex-col md:flex-row items-start justify-between px-4 py-2 gap-4 max-w-screen-xl mx-auto">
        <div className="w-full md:w-2/3 flex flex-col gap-y-4 order-2 md:order-1">
          {/* {(!account) && (
            <WarningAlert title={account ? "Wrong account connected" : "No account connected"}>
              You need to connect your wallet interact with smart contracts
            </WarningAlert>
          )} */}

          <PayDropsSpinner on={isLoading} />

          <Card>
            <CardHeader>
              <CardTitle className="flex flex-row justify-between">
                Claim Paydrops<Link className={buttonVariants({ variant: "outline" })} to="/claim-history">Go to History</Link>
              </CardTitle>
              <LabeledInput
                value={root}
                id="paydrop-root"
                label="Root (Paydrop Identifier)"
                tooltip="The identifier of the paydrop is a merkle tree root"
                required
                onChange={(e) => {
                  setRoot(e.target.value)
                }}
                type="text"
                disabled={disableInput}
              />
            </CardHeader>
            <CardContent>
              <Button onClick={async () => await findDropTreeByRoot()} disabled={disableInput} >Search</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {droptree?.root !== undefined ? <PayDropsTable droptree={droptree} /> : null}

    </>
  );
}

