import { Link, useNavigate } from "react-router-dom";
// Internal components
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// Internal hooks
import { IS_PROD, NETWORK } from "@/constants";
import { Header } from "@/components/Header";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
import { fetchTreeBySponsor } from "@/utils/Irys";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { PayDropsSpinner } from "@/components/UploadSpinner";
import { CopyIcon } from "@/components/icons/copy";


export function MyDropTrees() {
  const navigate = useNavigate();

  const { account, wallet } = useWallet();

  const { toast } = useToast();

  const toast_default = (title: string, description: string) => {
    toast({
      variant: "default",
      title,
      description
    })
  }


  const [droptrees, setDroptrees] = useState<Array<any>>([]);

  const [currentPage, setCurrentPage] = useState(0);

  const [isLoading, setIsLoading] = useState(true);


  const getTotalPages = (_droptrees: Array<any>) => {
    const size = _droptrees.length;

    // TODO: make sure there are 8 on a single page and then show pagination arrows
    //TODO: calculate the max pages size
    //TODO: copy the pagination logic from another project

  }

  useEffect(() => {

    if (!account) {
      navigate("/create-droptree")
    }

    const fetchData = async () => {
      if (account) {
        const address = account.address;
        const results = await fetchTreeBySponsor(address);
        if (results.found) {
          setDroptrees(results.data);

        } else {
          toast_default("Not found", "No history found for the connected address")
        }
        setTimeout(() => {
          setIsLoading(false);
        }, 3000)
      }
    }

    fetchData();


  }, [account])


  if (!account) {
    return <div></div>
  }

  return (
    <>
      <Header title="Upload History" />
      <PayDropsSpinner on={isLoading} />
      <Table className="max-w-screen-xl mx-auto">
        {<TableCaption>The list of paydrops created by the connected address</TableCaption>}
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Identifier(Root)</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Recipients</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {droptrees.length > 0 &&
            droptrees.map((tree) => {
              const date = new Date(tree.timestamp).toLocaleString();
              return (
                <TableRow key={`${tree.timestamp}-${tree.root}`}>
                  <TableCell><ShortenRoot notifyClicker={() => toast_default("Copy", `${tree.root.substring(0, 20)}.... copied to clipboard`)} root={tree.root}></ShortenRoot></TableCell>
                  <TableCell>{date}</TableCell>
                  <TableCell>{tree.totalDeposit}{" "}{tree.fungibleAssetName}</TableCell>
                  <TableCell>{tree.leaves}</TableCell>
                  <TableCell><Button>View</Button></TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </>
  );
}

function ShortenRoot(props: { root: string, notifyClicker: CallableFunction }) {
  return <div>
    {props.root.substring(0, 5)}...{props.root.substring(props.root.length - 5, props.root.length)} <Button style={{ cursor: "pointer" }} onClick={() => {
      navigator.clipboard.writeText(props.root);
      props.notifyClicker()
    }} size={"icon"} variant={"icon"}><CopyIcon width={20} height={20} /></Button>
  </div>
}

