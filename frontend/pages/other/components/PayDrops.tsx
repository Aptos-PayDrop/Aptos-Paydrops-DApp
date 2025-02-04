import { PaginationButtons } from "@/components/PaginationButtonts";
import { LabeledInputWithButton } from "@/components/ui/labeled-input";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { getIsNullifiedBulk } from "@/view-functions/getIsNullified";
import { useEffect, useState } from "react";

const PAGESIZE = 10;
export function PayDropsTable(props: { droptree: any }) {
  const { creatorAddress, addresses, amounts, root } = props.droptree;

  const { toast } = useToast();

  const toast_default = (title: string, description: string) => {
    toast({
      variant: "default",
      title,
      description
    })
  }

  const [paginatedData, setPaginatedData] = useState<any>({
    addresses: [],
    amounts: []
  });

  const [currentPageNullified, setCurrentPageNullified] = useState<Array<boolean>>([]);


  const [pageData, setPageData] = useState({
    currentPage: 0,
    totalPages: 1
  });

  const [search, setSearch] = useState("");

  useEffect(() => {
    if (addresses) {
      const paginated_Addresses = splitDataPerPages(addresses, PAGESIZE);
      const paginated_Amounts = splitDataPerPages(amounts, PAGESIZE);
      setPaginatedData({ addresses: paginated_Addresses, amounts: paginated_Amounts });
      setPageData({ ...pageData, totalPages: paginated_Addresses.length })
    }
  }, [props.droptree])


  useEffect(() => {

    const fetchNullified = async () => {
      const currentAddresses = paginatedData.addresses[pageData.currentPage];
      if (currentAddresses) {
        const areNullified = await getIsNullifiedBulk({ sponsor: creatorAddress, root: root, checkedAddresses: currentAddresses })

        setCurrentPageNullified(areNullified);
      }
    }

    fetchNullified();


  }, [paginatedData, pageData])


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

  const triggerSearch = () => {
    //Traverse the paginated data
    let foundIt = false;
    let pageLocation = 0;
    for (let i = 0; i < paginatedData.addresses.length; i++) {
      if (foundIt) {
        break;
      }
      let pageAddr = paginatedData.addresses[i];
      for (let j = 0; j < pageAddr.length; j++) {
        if (search === pageAddr[j]) {

          foundIt = true;
          pageLocation = i;
          break
        }
      }
    }

    if (foundIt) {
      setPageData({ ...pageData, currentPage: pageLocation });
    } else {
      toast_default("Not found", "Address not found")
    }
  }


  return <Table className="max-w-screen-xl mx-auto">
    {<TableCaption>
      <PaginationButtons
        previousClicked={previousClicked}
        nextClicked={nextClicked}
        nextDisabled={pageData.currentPage === pageData.totalPages - 1}
        previousDisabled={pageData.currentPage === 0}
        currentPage={pageData.currentPage}
        totalPages={pageData.totalPages}
      ></PaginationButtons>
      <p>The list of available withdrawals in the tree.</p>
    </TableCaption>}
    <TableHeader>
      <TableRow>
        <TableHead>Address</TableHead>
        <TableHead>Amount</TableHead>
        <TableHead>Claimed</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell><SearchAddress
          searchedAddress={search}
          setSearchedAddress={setSearch}
          triggerSearch={triggerSearch}
        /></TableCell>
        <TableCell></TableCell>
        <TableCell></TableCell>
      </TableRow>
      {paginatedData.addresses[pageData.currentPage]?.length > 0 &&
        paginatedData.addresses[pageData.currentPage].map((address: string, index: number) => {
          const isNullified = currentPageNullified[index];

          let className = isNullified ? "bg-blue-50" : ""
          className = address === search ? "bg-blue-200" : className;

          return (
            <TableRow key={`address-${address}-index-${index}`} className={className}>
              <TableCell>{address}</TableCell>
              <TableCell>{paginatedData.amounts[pageData.currentPage][index]}</TableCell>
              <TableCell>{isNullified ? "Yes" : "No"}</TableCell>
            </TableRow>
          );
        })}
    </TableBody>
  </Table>
}

function SearchAddress(props: {
  searchedAddress: string,
  setSearchedAddress: (to: string) => void,
  triggerSearch: () => void
}) {
  return <LabeledInputWithButton
    value={props.searchedAddress}
    id="search-address-input"
    label="Search for an address"
    tooltip="Enter an address to search for"
    required
    type="text"
    onChange={(e) => {
      props.setSearchedAddress(e.target.value)
    }}
    btnText="Search"
    btnClick={props.triggerSearch}
  ></LabeledInputWithButton>

}