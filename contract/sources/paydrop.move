// Copyright 2024 Aptos Paydrop
// MIT LICENSE
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the Software)
// , to deal in the Software without restriction, including without
// limitation the rights to use, copy, modify, merge, publish, distribute,
// sublicense, and/or sell copies of the Software, and to permit persons to
// whom the Software is furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included
//  in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED AS IS, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
// THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR
// OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

//Paydrop allows a sponsor to transfer to multiple addresses using a single transaction
//scaled with zkp the supported amount is 500k addresses with a single transaction
//The use-cases are AirDrops,QuadraticFunding,Mass Payouts,Salaries
//The deposited payments have to be pulled.

//I want to create a smart contract where a user can deposit a FungibleAsset with a Merkle Tree Root
//And addresses that are in the merkle tree can withdraw a partial deposit using a zero knowledge proof with groth-16
//The contract should allow refund to the depositor the deposits that were not withdrawn

//named addresses
//@fee_manager_address - The address that will receive the fees
//@paydrop_addr - The address of the account deploying this contract

module paydrop_addr::paydrop {
    use std::signer;
    use std::bcs;
    use std::vector;
    use std::option::{Self,Option};

    use aptos_framework::fungible_asset::{Self, Metadata, FungibleStore};
    use aptos_framework::primary_fungible_store;
    use aptos_framework::object::{Self, Object, ExtendRef};
    use aptos_framework::event;

    use aptos_std::table::{Self,Table};

    use aptos_std::crypto_algebra::{
        Element,
        from_u64,
        multi_scalar_mul,
        eq,
        pairing,
        add,
        zero,
        deserialize
    };

    use aptos_std::bn254_algebra::{
        Fr,
        FormatFrLsb,
        FormatG1Compr,
        FormatG2Compr,
        G1,
        G2,
        Gt,
        FormatG1Uncompr,
        FormatG2Uncompr
    };

    /// Sponsor account has not been set up to create Forest
    const ESPONSOR_ACCOUNT_NOT_INITIALIZED: u64 = 1;
    const EDROPTREE_NOT_FOUND: u64 = 2;
    const ENOT_ENOUGH_BALANCE: u64 = 3;
    const ERR_AMOUNT_ZERO: u64 = 4;
    const ERR_INVALID_LEAVES: u64 = 5;
    const ERR_INVALID_ROOT: u64 = 6;
    const ERR_DROPTREE_EMPTY: u64 = 7;
    const ERR_TOO_MANY_LEAVES: u64 = 8;
    const ERR_DROPTREEE_ALREADY_ENABLED: u64 = 9;
    const ERR_NO_DEPOSIT_TO_ENABLE: u64 = 10;
    const ERR_INVALID_SPONSOR:u64 = 11;
    const ERR_DROPTREE_DISABLED: u64 = 12;
    const ERR_ALREADY_NULLIFIED: u64 = 13;
    const ERR_INVALID_AMOUNT: u64 = 14;
    const ERR_NO_MORE_LEAVES: u64 = 15;
    const ONLY_CREATOR :u64 = 16;
    const ERR_EXCEEDS_MAX_FEE:u64 = 17;

    //Stores the PayDrop Tree root and withdraw parameters
    struct DropTree has store {
        //The total deposit contained in the DropTree
        total_deposit: u64,
        //The amount of deposits left, 0 is an inactive Tree
        deposit_left: u64,

        //The addresses that withdrew paydrop are in the nullifiers
        nullifiers: Table<address, bool>,

        //Total bottom leaves of the merkle tree each represent a withdraw
        total_leaves: u64,

        //the unused leaves are the withrawals that are left
        unused_leaves: u64,

        //The fungible asset metadata for this drop tree
        fa_metadata_object: Object<Metadata>,
        //The fungible store that holds the deposit
        deposit_store: Object<FungibleStore>,
        //paydrop Withdrawals are enabled?
        enabled: bool

    }

    //The Forest is stored per sponsor address and contains Trees
    struct Forest has key {
        //A single sponsor can create multiple trees
        //The trees can be accessed using the root hash of the merkle tree
        trees: Table<u256, DropTree>,
        size: u64
    }

    //Global per contract
    //Generate signer to send withdraw to user
    struct FungibleStoreController has key {
        extend_ref: ExtendRef
    }

    //Global per contract
    struct Config has key {
        //The Creator can update the fee manager address
        contract_creator: address,
        //The address that receives the fee and can update the fee
        fee_manager_address: address,
        //The withdraw fee
        fee: u64
        //The verification elements are set by the contract_creator using an init function
    }

    #[event]
    //The event emitted when a new PayDrop is created
    struct CreateDropTree has drop, store {
        //The sponsor of the PayDrop
        sponsor: address,
        //The total amount of tokens deposited
        total_deposit: u64,
        //The merkle root of the paydrop
        merkle_root: u256,
        //The available drops
        available_drops: u64
    }

    #[event]
    //The event is emitted when a drop is claimed
    struct DropClaimed has drop, store {
        // The sponsor of the drop
        sponsor: address,
        //the merkle root of the DropTree
        merkle_root: u256,
        //The recipient of the Drop
        recipient: address,
        //The amount received
        amount: u64
    }

    #[event]
    //The paydrop is refunded to the sponsor
    struct DropRefunded has drop, store {
        // The sponsor of the drop
        sponsor: address,
        //the merkle root of the DropTree
        merkle_root: u256
    }

    #[event]
    //A disabled droptree can be enabled
    struct DropTreeEnabled has drop, store {
        sponsor: address,
        merkle_root: u256
    }

    /// If you deploy the module under an object, sender is the object's signer
    /// If you deploy the module under your own account, sender is your account's signer
    fun init_module(sender: &signer) {

        //Create the config
        let sender_addr = signer::address_of(sender);
        //Move the initial configuration to global storage
        move_to(
            sender,
            Config {
                contract_creator: sender_addr,
                //Arguments injected using move.compile or publish
                fee_manager_address: @fee_manager_address,
                fee: 0
            }
        );

        //This is the signer for the fungible stores created per forest
        let fungible_store_constructor_ref = &object::create_object(sender_addr);

        move_to(
            sender,
            FungibleStoreController {
                extend_ref: object::generate_extend_ref(fungible_store_constructor_ref)
            }
        );
    }

    //The creator of the contact can set the fee_manager_address
    public entry fun set_fee_manager(sender: &signer, new_fee_manager: address) acquires Config{
        let sender_addr = signer::address_of(sender);
        assert!(sender_addr == @paydrop_addr,ONLY_CREATOR);
        let config = borrow_global_mut<Config>(sender_addr);
        config.fee_manager_address = new_fee_manager;
    }

    // The creator can set the fees that are sent to the fee manager
    public entry fun set_fee(sender: &signer,new_fee:u64) acquires Config{
       let sender_addr = signer::address_of(sender);
       assert!(sender_addr == @paydrop_addr, ONLY_CREATOR);
       //Max fee limit is 25%
       assert!(new_fee < 25,ERR_EXCEEDS_MAX_FEE);
       let config = borrow_global_mut<Config>(sender_addr);
       config.fee = new_fee;
    }

    //I want to initialize the drop tree for the sponsor
    //This should create the first deposit If it doesn't exists
    public entry fun new_droptree(
        sender: &signer, //the sponsor will deposit into the droptree
        root: u256, //the root is the merkle root of the tree
        fa_address: address, //The address of the fungible asset selected
        total_deposit: u64, //The deposit of fungible asset
        total_leaves: u64, // the leaves deposited,
        enabled: bool // Withdrawals are enabled

    ) acquires Forest, FungibleStoreController {
        assert!(total_deposit > 0, ERR_AMOUNT_ZERO);
        assert!(total_leaves > 0, ERR_INVALID_LEAVES);
        assert!(total_leaves < 500000, ERR_TOO_MANY_LEAVES);
        assert!(root > 0, ERR_INVALID_ROOT);
        let sender_addr = signer::address_of(sender);

        // Now create the fa_metadata_object that will be used for the droptree
        let fa_metadata = object::address_to_object<Metadata>(fa_address);

        let store_signer = &generate_fungible_store_signer();
        let signer_addr = signer::address_of(store_signer);
        let constructor_ref = &object::create_object(signer_addr);

        let deposit_store = fungible_asset::create_store(constructor_ref, fa_metadata);

        assert!(
            primary_fungible_store::balance(sender_addr, fa_metadata) >= total_deposit,
            ENOT_ENOUGH_BALANCE
        );

        //Make the deposit into the fungible store
        fungible_asset::transfer(
            sender,
            primary_fungible_store::primary_store(sender_addr, fa_metadata),
            deposit_store,
            total_deposit
        );

        let droptree = DropTree {
            total_deposit,
            deposit_left: total_deposit,
            nullifiers: table::new(),
            total_leaves,
            unused_leaves: total_leaves,
            fa_metadata_object: fa_metadata,
            deposit_store: deposit_store,
            enabled
        };

        if (exists<Forest>(sender_addr)) {

            let forest = get_forest_for_update(sender_addr);

            //If the droptree was not new, this should update the mutable reference and add a new droptree
            table::add(&mut forest.trees, root, droptree);
            forest.size = forest.size + 1;
        } else {
            let newForest = Forest { trees: table::new(),size: 1 };

            table::add(&mut newForest.trees, root, droptree);

            move_to(sender, newForest)

        };

        event::emit(
            CreateDropTree {
                sponsor: sender_addr,
                total_deposit,
                merkle_root: root,
                available_drops: total_leaves
            }
        );
    }

    //The signer that created the droptree can withdraw it
    public entry fun refund_droptree(
        sender: &signer, root: u256
    ) acquires Forest, FungibleStoreController {
        let sender_addr = signer::address_of(sender);
        //Get mutable forest, this asserts the forest exists
        let forest = get_forest_for_update(sender_addr);

        //make sure the root and the droptree exists
        assert!(table::contains(&forest.trees, root), ERR_INVALID_ROOT);

        let droptree = table::borrow_mut(&mut forest.trees, root);
        //Take the left over deposits
        let deposit_left = droptree.deposit_left;
        //assert there are deposits left
        assert!(deposit_left > 0, ERR_DROPTREE_EMPTY);

        //Use the fungible store to withdraw the remaining deposits
        fungible_asset::transfer(
            &generate_fungible_store_signer(),
            droptree.deposit_store,
            //If the primary store doesn't exists, create it
            primary_fungible_store::ensure_primary_store_exists(
                sender_addr, droptree.fa_metadata_object
            ),
            deposit_left
        );

        // update the mutable reference to 0
        droptree.deposit_left = 0;

        //Disable the droptree
        droptree.enabled = false;

        //Emit the event that the drop tree was refunded

        event::emit(DropRefunded { sponsor: sender_addr, merkle_root: root })
    }

    //Claim a paydrop by proving the sender address is contained in the merkle root
    // The merkle root leaf is hash(sender address, withdraw amount),
    //The remaining arguments are a circom ZKP
    public entry fun claim_paydrop(
        sender: &signer,
        sponsor: address,
        root: u256,
        amount: u64,
        proof: vector<u256> // Contains 8 elements
    ) acquires Forest,FungibleStoreController,Config{
        //I get the address of the sender
        let sender_addr = signer::address_of(sender);
        //Check if the forest for the sponsor exists
        assert!(exists<Forest>(sponsor),ERR_INVALID_SPONSOR);
        //Get a mutable forest and check if the droptree with the root exists
        let forest = get_forest_for_update(sponsor);

        assert!(table::contains(&forest.trees, root), EDROPTREE_NOT_FOUND);

        //borrow mutable
        let droptree = table::borrow_mut(&mut forest.trees,root);

        //Check if it's enabled
        assert!(droptree.enabled,ERR_DROPTREE_DISABLED);

        //Check if the sender is nullified or not

        assert!(!table::contains(&droptree.nullifiers,sender_addr),ERR_ALREADY_NULLIFIED);
        assert!(amount > 0,ERR_AMOUNT_ZERO);
        assert!(root >0, ERR_INVALID_ROOT);
        assert!(droptree.deposit_left - amount >= 0,ERR_INVALID_AMOUNT);
        assert!(droptree.unused_leaves !=0,ERR_NO_MORE_LEAVES);
        //convert proof input
        let (a,b,c) = convert_proof_input(proof);

        //TODO: verify proof

        
        //Fees calculations
        let (finalAmount,fee) = calculate_fees(amount);

        //Do the withdraw to the recipient
        fungible_asset::transfer(
            &generate_fungible_store_signer(),
            droptree.deposit_store,
            primary_fungible_store::ensure_primary_store_exists(
                sender_addr,droptree.fa_metadata_object
            ),
            finalAmount
        );

        //Transfer the fee to the fee manager
        fungible_asset::transfer(
            &generate_fungible_store_signer(),
            droptree.deposit_store,
            primary_fungible_store::ensure_primary_store_exists(
                @paydrop_addr, droptree.fa_metadata_object
            ),
            fee
        );
 
        // nullify the sender
        table::add(&mut droptree.nullifiers,sender_addr,true);

        //write everything back 
        droptree.deposit_left = droptree.deposit_left - amount;

        droptree.unused_leaves = droptree.unused_leaves -1;        

        //emit an event
        event::emit(DropClaimed{
            sponsor,
            merkle_root: root,
            recipient: sender_addr,
            amount
        });
    }

    //Enable a drop tree, only allow enable if there is deposit
    public entry fun enable_droptree(sender: &signer, root: u256) acquires Forest {
        let sender_addr = signer::address_of(sender);
        let forest = get_forest_for_update(sender_addr);
        let droptree = table::borrow_mut(&mut forest.trees, root);

        assert!(!droptree.enabled, ERR_DROPTREEE_ALREADY_ENABLED);
        assert!(droptree.deposit_left > 0, ERR_NO_DEPOSIT_TO_ENABLE);

        droptree.enabled = true;

        event::emit(DropTreeEnabled { sponsor: sender_addr, merkle_root: root })

    }

    #[view]
    // return the total number of drop rees per sponsor
    public fun total_trees(sponsor: address): u64 acquires Forest {
        let forest = get_forest(sponsor);
        forest.size
    }

    #[view]
    //Returns the sponsors drop tree using the root hash
    public fun droptree_details(sponsor: address, root: u256): (u64, u64, u64, u64) acquires Forest {
        let selected_tree = tree_selector(sponsor, root);
        (
            selected_tree.total_deposit,
            selected_tree.deposit_left,
            selected_tree.total_leaves,
            selected_tree.unused_leaves
        )
    }

    #[view]
    //Returns if a recipient is nullified for the sponsors drop tree
    public fun is_nullified(
        sponsor: address, root: u256, recipient: address
    ): bool acquires Forest {
        let selected_tree = tree_selector(sponsor, root);
        //Returns if the nullifiers contains the recipient address
        table::contains(&selected_tree.nullifiers, recipient)
    }
    
    #[view]
    public fun calculate_fees(amount: u64): (u64,u64) acquires Config{
        let config = borrow_global<Config>(@paydrop_addr);
        let onePercent = amount / 100;
        let fee = config.fee * onePercent;
        let finalAmount = amount - fee;
        (finalAmount,fee)
    }


    inline fun tree_selector(sponsor: address, root: u256): &DropTree {
        let forest = get_forest(sponsor);
        assert!(table::contains(&forest.trees, root), EDROPTREE_NOT_FOUND);
        table::borrow(&forest.trees, root)
    }

    inline fun get_forest(sponsor: address): &Forest {
        assert!(exists<Forest>(sponsor), ESPONSOR_ACCOUNT_NOT_INITIALIZED);
        borrow_global<Forest>(sponsor)
    }

    inline fun get_forest_for_update(sponsor: address): &mut Forest {
        assert!(exists<Forest>(sponsor), ESPONSOR_ACCOUNT_NOT_INITIALIZED);
        borrow_global_mut<Forest>(sponsor)
    }

    
    // Generate signer to send value from fungible stores
    fun generate_fungible_store_signer(): signer acquires FungibleStoreController {
        object::generate_signer_for_extending(
            &borrow_global<FungibleStoreController>(@paydrop_addr).extend_ref
        )
    }


    
    //TODO: get the vkey for the verification
    // inline fun get_vkey():(Element<G1>){}

    //TODO:
    // inline fun convert_public_input(recipient: address, amount: u64, root: u256){}

    inline fun convert_proof_input(proof: vector<u256>):(Element<G1>,Element<G2>,Element<G1>) {
        let a_x = *vector::borrow(&proof,0);
        let a_y = *vector::borrow(&proof,1);
        let b_x1 = *vector::borrow(&proof,2);
        let b_y1 = *vector::borrow(&proof,3);
        let b_x2 = *vector::borrow(&proof,4);
        let b_y2 = *vector::borrow(&proof,5);
        let c_x = *vector::borrow(&proof,6);
        let c_y = *vector::borrow(&proof,7);

        let a_bytes = bcs::to_bytes<u256>(&a_x);
        let a_y_bytes = bcs::to_bytes<u256>(&a_y);
        vector::append(&mut a_bytes, a_y_bytes);
        let a = std::option::extract(
            &mut deserialize<G1, FormatG1Uncompr>(&a_bytes)
        );

        let b_bytes = bcs::to_bytes<u256>(&b_x1);
        let b_y1_bytes = bcs::to_bytes<u256>(&b_y1);
        let b_x2_bytes = bcs::to_bytes<u256>(&b_x2);
        let b_y2_bytes = bcs::to_bytes<u256>(&b_y2);
        vector::append(&mut b_bytes, b_y1_bytes);
        vector::append(&mut b_bytes, b_x2_bytes);
        vector::append(&mut b_bytes, b_y2_bytes);
        let b = std::option::extract(
            &mut deserialize<G2, FormatG2Uncompr>(&b_bytes)
        );

        let c_bytes = bcs::to_bytes<u256>(&c_x);
        let c_y_bytes = bcs::to_bytes<u256>(&c_y);
        vector::append(&mut c_bytes, c_y_bytes);
        let c = std::option::extract(
            &mut deserialize<G1, FormatG1Uncompr>(&c_bytes)
        );

        (a, b, c)
    }

    /// SOURCE: https://github.com/aptos-labs/aptos-core/blobmain/aptos-move/move-examples/groth16_example/sources/groth16.move
    /// Proof verification as specified in the original paper,
    /// with the following input (in the original paper notations).
    /// - Verification key: $\left([\alpha]_1, [\beta]_2, [\gamma]_2, [\delta]_2, \left\\{ \left[ \frac{\beta \cdot u_i(x) + \alpha \cdot v_i(x) + w_i(x)}{\gamma} \right]_1 \right\\}\_{i=0}^l \right)$.
    /// - Public inputs: $\\{a_i\\}_{i=1}^l$.
    /// - Proof $\left( \left[ A \right]_1, \left[ B \right]_2, \left[ C \right]_1 \right)$.
    public fun verify_proof<G1, G2, Gt, S>(
        vk_alpha_g1: &Element<G1>,
        vk_beta_g2: &Element<G2>,
        vk_gamma_g2: &Element<G2>,
        vk_delta_g2: &Element<G2>,
        vk_uvw_gamma_g1: &vector<Element<G1>>,
        public_inputs: &vector<Element<S>>,
        proof_a: &Element<G1>,
        proof_b: &Element<G2>,
        proof_c: &Element<G1>
    ): bool {
        let left = pairing<G1, G2, Gt>(proof_a, proof_b);
        let scalars = vector[from_u64<S>(1)];
        std::vector::append(&mut scalars, *public_inputs);
        let right = zero<Gt>();
        let right = add(
            &right,
            &pairing<G1, G2, Gt>(vk_alpha_g1, vk_beta_g2)
        );
        let right =
            add(
                &right,
                &pairing(&multi_scalar_mul(vk_uvw_gamma_g1, &scalars), vk_gamma_g2)
            );
        let right = add(&right, &pairing(proof_c, vk_delta_g2));
        eq(&left, &right)
    }

    #[test_only]
    use aptos_std::crypto_algebra::{deserialize, enable_cryptography_algebra_natives};
    #[test_only]
    use aptos_std::bn254_algebra::{
        Fr,
        FormatFrLsb,
        FormatG1Compr,
        FormatG2Compr,
        G1,
        G2,
        Gt
    };
    #[test_only]
    use std::vector;

    #[test(fx = @std)]
    fun test_verify_proof_with_bn254(fx: signer) {
        enable_cryptography_algebra_natives(&fx);

        let vk_alpha_g1 =
            std::option::extract(&mut deserialize<G1, FormatG1Compr>(&__VK_ALPHA_G1__));
        let vk_beta_g2 =
            std::option::extract(&mut deserialize<G2, FormatG2Compr>(&__VK_BETA_G2__));
        let vk_gamma_g2 =
            std::option::extract(&mut deserialize<G2, FormatG2Compr>(&__VK_GAMMA_G2__));
        let vk_delta_g2 =
            std::option::extract(&mut deserialize<G2, FormatG2Compr>(&__VK_DELTA_G2__));
        let vk_gamma_abc_g1_bytes = __VK_GAMMA_ABC_G1__;
        let public_inputs_bytes = __VK_PUBLIC_INPUTS__;
        assert!(
            vector::length(&public_inputs_bytes) + 1
                == vector::length(&vk_gamma_abc_g1_bytes),
            1
        );

        let vk_gamma_abc_g1 =
            std::vector::map(
                vk_gamma_abc_g1_bytes,
                |item| {
                    let bytes: vector<u8> = item;
                    std::option::extract(&mut deserialize<G1, FormatG1Compr>(&bytes))
                }
            );

        let public_inputs =
            std::vector::map(
                public_inputs_bytes,
                |item| {
                    let bytes: vector<u8> = item;
                    std::option::extract(&mut deserialize<Fr, FormatFrLsb>(&bytes))
                }
            );

        let proof_a =
            std::option::extract(&mut deserialize<G1, FormatG1Compr>(&__PROOF_A__));
        let proof_b =
            std::option::extract(&mut deserialize<G2, FormatG2Compr>(&__PROOF_B__));
        let proof_c =
            std::option::extract(&mut deserialize<G1, FormatG1Compr>(&__PROOF_C__));

        assert!(
            verify_proof<G1, G2, Gt, Fr>(
                &vk_alpha_g1,
                &vk_beta_g2,
                &vk_gamma_g2,
                &vk_delta_g2,
                &vk_gamma_abc_g1,
                &public_inputs,
                &proof_a,
                &proof_b,
                &proof_c
            ),
            1
        );
    }
}
