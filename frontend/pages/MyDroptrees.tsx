import { Link, useNavigate } from "react-router-dom";
// Internal components
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// Internal hooks
import { IS_PROD, NETWORK } from "@/constants";
import { Header } from "@/components/Header";

//TODO: Action should be : Created Droptree, Refunded Droptree, Claimed Drop

const mockFas = {
  asset_type: "something",
  name: "name",

}

export function MyDropTrees() {
  // const fas = useGetAssetMetadata();
  const fas = [mockFas, mockFas, mockFas];
  // If we are on Production mode, redierct to the public mint page
  const navigate = useNavigate();
  if (IS_PROD) navigate("/", { replace: true });


  //TODO: Use the aptos Indexer to fetch the events for this account address
  //If the address is not connected who an error

  //Render the fetched events into the table

  return (
    <>
      <Header title="History" />
      <Table className="max-w-screen-xl mx-auto">
        {<TableCaption>A list of the fungible assets created under the current contract.</TableCaption>}
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Action</TableHead>
            <TableHead>Asset Name</TableHead>
            <TableHead>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fas.length > 0 &&
            fas.map((fa) => {
              return (
                <TableRow key={fa.asset_type}>
                  <TableCell>{fa.name}</TableCell>
                  <TableCell>cell</TableCell>
                  <TableCell>cell</TableCell>
                  <TableCell>12</TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </>
  );
}
