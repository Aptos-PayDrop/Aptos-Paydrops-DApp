import { Link } from "react-router-dom";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { convertAmountFromOnChainToHumanReadable } from "@/utils/helpers";
import { NETWORK } from "@/constants";
import { Header } from "@/components/Header";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { WarningAlert } from "@/components/ui/warning-alert";
import { useEffect, useState } from "react";
import { getClaimHistory } from "@/view-functions/getClaimHistory";
import { useToast } from "@/components/ui/use-toast";
import { query_fungible_asset_metadata } from "@/view-functions/graphql";
import { Network } from "@aptos-labs/ts-sdk";
import { ShortenRoot } from "./other/components/ShortenRoot";
import { Spinner } from "@/components/ui/spinner";
import { PaginationButtons } from "@/components/PaginationButtonts";
import { buttonVariants } from "@/components/ui/button";

const PAGESIZE = 10;

export function MyHistory() {
  const { account } = useWallet();
  const [paginatedHistory, setPaginatedHistory] = useState<any>([[]]);
  const [pageData, setPageData] = useState({
    currentPage: 0,
    totalPages: 1
  })

  const [assetMetadata, setAssetMetadata] = useState(new Map());

  const { toast } = useToast();

  const toast_default = (title: string, description: string) => {
    toast({
      variant: "default",
      title,
      description
    })
  }

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

  async function setAssetMetadataActions(currentPage: number) {
    const currentData = paginatedHistory[currentPage];
    const network = NETWORK === "testnet" ? Network.TESTNET : Network.MAINNET;

    const newMap = new Map(assetMetadata);
    //I check if the asset metadata is in the map and if not I add it, then I update state
    for (let i = 0; i < currentData.length; i++) {
      const fa_address = currentData[i].fa_metadata.inner;

      if (newMap.has(fa_address)) {
        return;
      }

      const Fa_metadata = await query_fungible_asset_metadata(network, fa_address);
      const decimals = Fa_metadata.decimals;
      const name = Fa_metadata.name;
      const symbol = Fa_metadata.symbol;

      newMap.set(fa_address, { decimals, name, symbol })

      //Adding a little timeout for the animation to play out
      setTimeout(() => {
        setAssetMetadata(newMap)
      }, 1000)

    };
  }


  useEffect(() => {
    const getHistory = async () => {
      if (account?.address) {
        const claimHistory = await getClaimHistory({ for_address: account.address }).catch((err) => {
          console.error(err);
          toast_default("Not found", "History not found");
        })

        if (claimHistory) {
          const pagedData = splitDataPerPages(claimHistory, PAGESIZE);
          setPaginatedHistory(pagedData);
          setPageData({
            currentPage: 0,
            totalPages: pagedData.length
          })

          await setAssetMetadataActions(0)

        }
      }
    }

    getHistory()
  }, [account])

  useEffect(() => {
    setAssetMetadataActions(pageData.currentPage)
  }, [pageData])


  function renderAmount(fa_address: string, fa_amount: number) {
    const fa_data = assetMetadata.get(fa_address);
    if (!fa_data) {
      return <Spinner />
    }

    const decimals = fa_data.decimals;
    const symbol = fa_data.symbol;

    return <p>{convertAmountFromOnChainToHumanReadable(fa_amount, decimals)} {symbol}</p>
  }


  if (!account) {
    return <>
      <Header title="Claim History"></Header>
      <WarningAlert title={account ? "No account found" : "No account connected"}>
        To see your history, connect your account
      </WarningAlert>
    </>
  }


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

  return (
    <>
      <Header title="Claim History" />
      <Table className="max-w-screen-xl mx-auto">
        <TableCaption>
          <PaginationButtons
            previousClicked={previousClicked}
            nextClicked={nextClicked}
            nextDisabled={pageData.currentPage === pageData.totalPages - 1}
            previousDisabled={pageData.currentPage === 0}
            currentPage={pageData.currentPage}
            totalPages={pageData.totalPages}></PaginationButtons>
          <p>The list of claimed fungible paydrops</p>
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead >Action</TableHead>
            <TableHead>Sponsor Address</TableHead>
            <TableHead>Claimed Amount</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedHistory[pageData.currentPage].length > 0 &&
            paginatedHistory[pageData.currentPage].map((pa: any) => {
              return (
                <TableRow key={pa.root}>
                  <TableCell><ShortenRoot notifyClicker={() => toast_default("Copy", `${pa.root.substring(0, 20)}.... copied to clipboard`)} root={pa.root}></ShortenRoot></TableCell>
                  <TableCell><ShortenRoot notifyClicker={() => toast_default("Copy", `${pa.sponsor.substring(0, 20)}.... copied to clipboard`)} root={pa.sponsor}></ShortenRoot></TableCell>
                  <TableCell>{renderAmount(pa.fa_metadata.inner, pa.amount)}</TableCell>
                  <TableCell><Link to={`/droptree/${pa.root}`} className={buttonVariants({ variant: "outline" })}>View</Link></TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </>
  );
}
