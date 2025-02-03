import { Link, useNavigate } from "react-router-dom";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Header } from "@/components/Header";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
import { fetchTreeBySponsor } from "@/utils/Irys";
import { useToast } from "@/components/ui/use-toast";
import {  buttonVariants } from "@/components/ui/button";
import { PayDropsSpinner } from "@/components/UploadSpinner";

import { PaginationButtons } from "@/components/PaginationButtonts";
import { ShortenRoot } from "./other/components/ShortenRoot";

const PAGESIZE = 5;

export function MyDropTrees() {
  const navigate = useNavigate();

  const { account } = useWallet();

  const { toast } = useToast();

  const toast_default = (title: string, description: string) => {
    toast({
      variant: "default",
      title,
      description
    })
  }


  const [droptreePages, setDroptreePages] = useState<Array<any>>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [pageData, setPageData] = useState({
    currentPage: 0,
    totalPages: 1
  });

  function splitDataPerPages(data: Array<any>, pageSize: number) {
    const res = [];
    for (let i = 0; i < data.length; i++) {
      if (i % pageSize === 0) {
        res.push(new Array());
      }
      res[res.length - 1].push(data[i]);
    };
    return res;
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
          const pagedData = splitDataPerPages(results.data, PAGESIZE)
          setDroptreePages(pagedData);
          setPageData({
            currentPage: 0,
            totalPages: pagedData.length
          });

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

  const previousClicked = async () => {
    if (pageData.currentPage !== 0) {
      const newPage = pageData.currentPage - 1;
      setPageData({ ...pageData, currentPage: newPage })
    }
  }

  const nextClicked = async () => {
    if (pageData.currentPage !== pageData.totalPages - 1) {
      const newPage = pageData.currentPage + 1;
      setPageData({ ...pageData, currentPage: newPage })
    }
  }


  if (!account) {
    return <div></div>
  }

  return (
    <>
      <Header title="Upload History" />
      <PayDropsSpinner on={isLoading} />
      <Table className="max-w-screen-xl mx-auto">
        <TableCaption>
          <PaginationButtons
            previousClicked={previousClicked}
            nextClicked={nextClicked}
            nextDisabled={pageData.currentPage === pageData.totalPages - 1}
            previousDisabled={pageData.currentPage === 0}
            currentPage={pageData.currentPage}
            totalPages={pageData.totalPages}></PaginationButtons>
          <p>The list of paydrops uploaded by the connected address</p>

        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Identifier(Root)</TableHead>
            <TableHead className="w-[200px]">Timestamp</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Recipients</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {droptreePages[pageData.currentPage]?.length > 0 &&
            droptreePages[pageData.currentPage].map((tree: any) => {
              const date = new Date(tree?.timestamp).toLocaleString();

              if (!tree) {
                return null
              }

              return (
                <TableRow key={`${tree.timestamp}-${tree.root}`}>
                  <TableCell><ShortenRoot notifyClicker={() => toast_default("Copy", `${tree.root.substring(0, 20)}.... copied to clipboard`)} root={tree.root}></ShortenRoot></TableCell>
                  <TableCell>{date}</TableCell>
                  <TableCell>{tree.totalDeposit}{" "}{tree.fungibleAssetName}</TableCell>
                  <TableCell>{tree.leaves}</TableCell>
                  <TableCell><Link to={`/droptree/${tree.root}`} className={buttonVariants({ variant: "outline" })}>View</Link></TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </>
  );
}

