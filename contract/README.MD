# Aptos paydrop
The `Aptos PayDrop` smart contracts are written in the `Move language` and were developer for the Aptos blockchain.
The sources directory contains the main contract `paydrop.move` m you can find the tests in `tests/paydrop_test_end_to_end.move`

The smartcontracts are designed to hold Fungible Asset deposits and allow claiming parts of the deposits by addresses that can provide a valid Groth-16 proof to withdraw the value.
Each deposit can be divided into up to 500.000 withdrawals however the average expected size is in the thousands.
The smart contract is opensource  with an MIT license.

## API Docs

## Structs

`DropTree`

The droptree struct holds the deposits for each sponsor.
The droptree contains the fungible asset metadata and the Fungible Store for the assets and stores data about the remaining deposits.
Each droptree is a merkle tree and has a root.

`Forest` is a struct that contains the trees. The forest is saved using the sponsor's address.

`FungibleStoreCOntroller` is a struct to hold the extend_ref to create the signer for each DropTree's Fungible Store, it's used for withdrawing

`Config` is the main configuration struct that contains the fee_manager_address and the fee percentage and allows the fee_manager to set the fees.

`ClaimHistory` contains `ClaimHistoryParameters` in a vector which is used for storing the claim history per claimer for easy display on the front end.

`VerificationKey` is a struct that holds the Verification Key created from the circom circuit, used for the Groth-16 zkp scheme

Events

`CreateDropTree` event is emitted when a droptree is created

`DropClaimed` event is emitted when an address claim a part of the deposit

`DropRefunded` is emitted when the contents of the droptree is refunded to it's sponsor.

`DropTreeEnabled` event is emitted if a droptree was created disabled, but has been enabled after

## init
the init_module function sets up the contract, it will initialzie the Config struct and the FungibleStoreController for signing.

## Entry functions
`initialize_vkey` an entry function that can be called by the @fee_manager_address, the verification key is converted into a vector and the function is called with it. It will save the verification key to global storage under the fee_manager_address

`set_fee_manager` The old fee manager can assign it's address to a new one inside the config object. The purpose of this is to assign a new address that will receive the fee. This function can be only called by the @fee_manager_address that was compiled into the contract during deployment

`set_fee` This allows the old fee_manager_address to set the fee percentage. The maximum is 25 which means a 25% fee max.

`new_droptree` This function can be called by any sender that wishes to create a droptree for paydrops.
The function must contain the root of the merkle tree, the fungible asset metadata and deposit details.

`refund_droptree` The deposit can be refunded by the sponsor using the root 

`claimPaydrop` The claim function can be invoked by an address whose address can be found in the merkle root. The proof is computed on the client side using snark js.

`enable_droptree` If a droptree was not enabled when it was created, it can be enabled later on.

### View Functions
`total_trees` Retuns the total trees for a sponsor

`droptree_details` Returns the droptree details for a sponsor and root, It basically returns a DropTree struct

`is_nullified` checks if a single address is nullified and have claimed it's share from the droptree

`is_nullified_bulk` checks multiple addresses if they are nullified and have claimed their share from the droptree

`calculate_fees` This function will take the amount and return the amount that will be actually withdrawn and the fee that will be deducted

`get_fee` returns the fee percentage

`get_claim_history` Returns the history of claims for an address


### How the ZKP works
The verification key of the circuit must be saved in the contract for this to work.
The proof is passed as a vector<u256> and the public signals are calculated using internal functions.

Because the Aptos address type is u256, it can't be used inside the circuit directly as it accepts a 254 bit size integer only so the work around was to hash the address using blake2b-256 and then cut the last byte off the vector, thereby creating a 248 bit hash, which is secure and fits into the bn128 curve. The resulting hash must be converted into a number, which is not provided natively by Move so the implementation uses bitshifting.
You can find the inline functions used for this `hashAddressForSnark` `convertHashToInt` This was essential to make sure the address can be used inside a zk-snark, which makes the whole idea of this project come true.
Without using addresses inside zksnarks, they are insecure and could be front-run.
The `prepare_public_signals` inline function takes care of handling the public signals.


# Tests
The contracts are tested with the Aptos cli

`aptos move test` will run all the unit tests

You need to uncomment the paydrop_addr in the Move.toml file to run the tests, it's commented for deployment but used for tests

# Deployment 

The contract is currenty published under object 0x629a9a226a53badad0e3a18bb81408c1b2bf5072363dfef603d8af559f2755e3 on aptos testnet

To deploy it, use the aptos command line

`aptos move depoloy-object` and `aptos move upgrade-object` commands are used to deploy and upgrade the contracts