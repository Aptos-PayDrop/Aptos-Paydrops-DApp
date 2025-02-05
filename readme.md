# Aptos Paydrops

**A scaling solution for Mass Payments using Fungible Assets on Aptos**
Scaling to up to 500k withdraws from a single deposit

![logo](/public/logo_circular_200scale.webp)

# AirDrops, Quadratic Funding, Payrolls and Mass Payouts

## How to use?

Navigate to [aptospaydrops.com](https://aptospaydrops.com)

You can either create new paydrops or claim paydrops, using a `root` identifier that was shared with you.

## Create new paydrops
Navigate to [Fund Paydrops](https://aptospaydros/create-droptree) to upload a new merkle tree and make a deposit

Prepare the addresses you want to make payments first in an excel sheet and export it as csv.

The csv must have addresses,amounts columns

![Csv](/examples/create_csv.png)

Then visit the website

![fund paydrops](/examples/Fund_paydrops.png)

You need to enter the fungible asset address and hit `Fetch Asset Metadata`, it will display the metadata under it. Make sure you have enough balance to deposit the required amount.

Click Choose CSV file and select the file.
It will quickly verify the file. Then you need to hit Mine MerkleTree

![](/examples/Mine_merkletree.png)

The will **pre-mine the merkle tree** that contains the list of addresses and their claims. The tree is used for creating withdraw proofs

When it's done hit `Upload and deposit Assets`

You will be prompted to upload the merkle tree to Irys. It's a decentralized storage solution. You need to deposit a little APT to fund the upload, it depends on the file size how much.

Then sign the transaction to deposit the fungible assets and you are ready to go.

You can chose to disable withdrawals, that means the DropTree will be created but nobody can use it, yet. You can enable it later manually.

### Claim

![Claim Page](/examples/claim_page.png)
To claim a deposit, visit the Claim Page and enter the root, which should be shared with you beforehand.

![Paydrops Page](/examples/paydrops-page.png)
You can see the details of the paydrops and if your address is in the merkle tree, you are able to withdraw the amount specified.

You can hit claim if you see the button and just withdraw your share.

You can search and see all the addresses found in the tree.

![Claimed](/examples/Claimed_paydrop.png)

### Refunds
if you created the deposit you can refund it any time and you will claim the remaining deposits and disable withdrawals. 


# Smart Contract
To learn more about the contracts, visit the contract's [readme.md](/contract/README.MD) They are developed using the Move programming language.

# Milestones left from the DApp


[] Groth-16 phase-2 ceremony to finalize the circuits

[] Mainnet deployment

[] Indexer server, to help finding paydrops without knowing the root