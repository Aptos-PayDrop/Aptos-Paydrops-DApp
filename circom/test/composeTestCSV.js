import { Account } from "@aptos-labs/ts-sdk";
import fs from "fs";
import path from "path";

async function random_addresses(size){
    let addresses = [];
    for(let i = 0; i < size;i++){
        let account = Account.generate();
 
        addresses.push(account.accountAddress.toString());
    }

    return addresses;
}

async function main() {
    const addresses = await random_addresses(20000);
    let amountToUse = 10;

    let csv  = "";

    for (let i = 0; i < addresses.length; i++){
        csv += `${addresses[i]},${amountToUse}\n`
    }

   fs.writeFileSync(path.join(process.cwd(),"example_large.csv"),csv)
}


main().catch(err => {
    console.error(err)
    process.exitCode = 1;
})