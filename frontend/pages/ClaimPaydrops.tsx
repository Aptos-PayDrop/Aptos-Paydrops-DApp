import { Header } from "@/components/Header";
import { useState } from "react";
import { LabeledInput } from "@/components/ui/labeled-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { fetchTreeByRoot } from "@/utils/Irys";
import { PayDropsSpinner } from "@/components/UploadSpinner";
import { useToast } from "@/components/ui/use-toast";


export function ClaimPaydrops() {

  const [root, setRoot] = useState("");
  const [disableInput, setDisableInput] = useState(false);
  const navigate = useNavigate();

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

    setDisableInput(true);

    //If not then do the fetch...
    const searchForTree = await fetchTreeByRoot(root);
    if (!searchForTree.found) {
      setDisableInput(false);
      if (searchForTree.error === "not found") {
        // this means the request was successful but not found
        toast_default("Not found", "The searched identifier does not exist!")
        return;
      }
      //else Network error
      toast_error("Unable to fetch data. Network error");
      return;
    }


    setTimeout(() => {
      navigate(`/droptree/${root}`)
    }, 1000)

  }

  return (
    <>
      <Header title="Claim Paydrops" />
      <div className="flex flex-col md:flex-row items-start justify-between px-4 py-2 gap-4 max-w-screen-xl mx-auto">
        <div className="w-full md:w-2/3 flex flex-col gap-y-4 order-2 md:order-1">

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

    </>
  );
}

