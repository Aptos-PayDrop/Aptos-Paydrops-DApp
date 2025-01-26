

// TODO: This page should render all the addresses that can withdraw in a table
//TODO: IT should show a claim button if the wallet can claim the paydrops
//If the creator is connected it should show a claim
//It should show how many wallets withdrew already and how many are left

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

//TODO: it could color the addresses in the table to show withdrawals

//TODO: when navitaging via url to root, it shoul show a loading indicator
//ANd then show the paydrops all

//TODO: it should be able to load the root from the indexed db storage once it was fetched

//TODO: sort the table by withdrawals completed or amounts

export function PayDropsTable(props: { droptree: any }) {
  const { creatorAddress, addresses, amounts, decimals, fungible_asset_address, leaves, nonce, root, tree } = props.droptree;

  //TODO: fetch the list of addresses that were nullified


  // const [merkleTree,setMeekleTree] = useStaete({});

  return <Table className="max-w-screen-xl mx-auto">
    {<TableCaption>The list of available withdrawals.</TableCaption>}
    <TableHeader>
      <TableRow>
        <TableHead>Address</TableHead>
        <TableHead>Amount</TableHead>
        <TableHead>Claimed</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {addresses.length > 0 &&
        addresses.map((address: string, index: number) => {
          return (
            <TableRow key={`address-${address}-index-${index}`}>
              <TableCell>{address}</TableCell>
              <TableCell>{amounts[index]}</TableCell>
              <TableCell>Loading</TableCell>
            </TableRow>
          );
        })}
    </TableBody>
  </Table>
}