import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";

export function DetailsCard(props: {
    creatorAddress: string,
    root: string,
    depositedAmount: number,
    faName: string,
    showEnable: boolean,
    amountLeft: number,
    totalLeaves: string,
    unusedLeaves: string,
    assetExplorerLink: string,
    existsOnChain: boolean,
    amountToDepositIfNotExists: string,
    onEnableClicked: () => void,
    feePercentage: string
}) {
    return <Card>
        <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>See the Paydrop details and interact with the smart contracts</CardDescription>
        </CardHeader>
        <CardContent>
            <Link className={buttonVariants({ variant: "outline" })} target={"_blank"} to={props.assetExplorerLink}>Fungible Asset Link</Link>
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell>Creator:</TableCell>
                        <TableCell>{props.creatorAddress}</TableCell>
                    </TableRow>
                    {props.showEnable && props.existsOnChain && props.amountLeft > 0 ? <TableRow>
                        <TableCell>Withdrawals are disabled</TableCell>
                        <TableCell><Button onClick={props.onEnableClicked}>Enable</Button></TableCell>
                    </TableRow> : null}


                    <TableRow>
                        <TableCell>Root:</TableCell>
                        <TableCell>{props.root}</TableCell>
                    </TableRow>
                    {props.existsOnChain ?
                        <TableRow>
                            <TableCell>Value:</TableCell>
                            <TableCell>Total Deposit: <strong>{props.depositedAmount}{" "}{props.faName}</strong>, Remaining value: <strong>{props.amountLeft}{" "}{props.faName}</strong>, Withdrawals left: <strong>{props.unusedLeaves}/{props.totalLeaves}</strong>, Claim Fee: {props.feePercentage}%</TableCell>
                        </TableRow> : null}

                    {!props.existsOnChain ? <TableRow>
                        <TableCell>Amount to deposit:</TableCell>
                        <TableCell>{props.amountToDepositIfNotExists}</TableCell>
                    </TableRow> : null}

                    {props.showEnable && props.existsOnChain && props.amountLeft === 0 ? <TableRow>
                        <TableCell>Status:</TableCell>
                        <TableCell>REFUNDED</TableCell>
                    </TableRow> : null}

                </TableBody>
            </Table>
        </CardContent>
    </Card>
}