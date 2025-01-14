//Paydrop allows a sponsor to fund multiple addresses that can pull a paydrop
//scaled with zkp the supported amount is 500k addresses with a single transaction
//The use-cases are AirDrops,QuadraticFunding,Mass Payments,Salaries


//I want to create a smart contract where a user can deposit a FungibleAsset with a Merkle Tree Root
//And addresses that are in the merkle tree can withdraw a partial deposit using a zero knowledge proof with groth-16
//The contract should allow refund to the depositor the deposits that were not withdrawn

//named addresses
//@fee_manager_address - The address that will receive the fees
//@paydrop_addr - The address of the account deploying this contract



module paydrop_addr::paydrop {
    use std::signer;

    use aptos_std::smart_table::{Self, SmartTable};

    use aptos_framework::fungible_asset::{Self, Metadata, FungibleStore};
    use aptos_framework::primary_fungible_store;

    use aptos_framework::timestamp;

    /// Sponsor account has not been set up to create DropTrees
    const ESPONSOR_ACCOUNT_NOT_INITIALIZED: u64 = 1;
    const EDROPTREE_NOT_FOUND: u64 = 2;
    const ENOT_ENOUGH_BALANCE: u64 = 3;
    const ERR_AMOUNT_ZERO: u64 = 4;
    const ERR_INVALID_LEAVES : u64 = 5;
    const ERR_INVALID_ROOT: u64 = 6;
    const ERR_DROPTREE_EMPTY:u64 = 7;

    //Stores the PayDrop Tree root and withdraw parameters
    struct DropTree has store {
        //The total deposit contained in the DropTree
        total_deposit: u64,
        //The amount of deposits left, 0 is an inactive Tree
        deposit_left: u64,

        //The addresses that withdrew a drop are in the nullifiers
        nullifiers: SmartTable<address, bool>,

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
    //TODO: rename to "Forest"
    struct DropTrees has key {
        //A single sponsor can create multiple trees
        //The trees can be accessed using the root hash of the merkle tree
        trees: SmartTable<u256, DropTree>
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

        //This is the signer for the fungible stores created per droptrees
        let fungible_store_constructor_ref = &object::create_object(sender_addr);

        move_to(
            sender,
            FungibleStoreController {
                extend_ref: object::generate_extend_ref(fungible_store_constructor_ref)
            }
        );

    }

    //I want to initialize the drop tree for the sponsor
    //This should create the first deposit If it doesn't exists
    public entry fun new_droptree(
        sender: &signer, //the sponsor will deposit into the droptree
        root: u256, //the root is the merkle root of the tree
        fa_address: address, //The address of the fungible asset selected
        total_deposit: u64, //The deposit of fungible asset
        total_leaves: u64 // the leaves deposited,
        enabled: bool // Withdrawals are enabled

    ) acquires DropTrees,FungibleStoreController {
        assert!(total_deposit > 0, ERR_AMOUNT_ZERO);
        assert!(total_leaves > 0, ERR_INVALID_LEAVES);
        assert!(root > 0, ERR_INVALID_ROOT);
        let sender_addr = signer::address_of(sender);
        let (droptrees, is_new) = get_or_create_droptree(fa_address, sender_addr);

        // Now create the fa_metadata_object that will be used for the droptree
        let fa_metadata = object::address_to_object<Metadata>(fa_address);

        let store_signer = &generate_fungible_store_signer();
        let signer_addr = signer::address_of(store_signer);
        let constructor_ref = &object::create_object(signer_addr);

        let deposit_store = fungible_asset::create_store(constructor_ref, fa_meadata);

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
            nullifiers: smart_table::new(),
            total_leaves,
            fa_metadata_object: fa_metadata,
            deposit_store: deposit_store,
            enabled
        };

        //If the droptree was not new, this should update the mutable reference and add a new droptree
        smart_table::add(&mut droptrees.trees, droptree);

        if (is_new) {
            move_to(sender_addr, DropTrees { tree: smart_table::new(root, droptree) })
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
    public entry fun refund_droptree(sender: &signer, root: u256) acquires DropTrees,FungibleStoreController {
      let sender_addr = signer::address_of(sender);
      //Get mutable droptrees, this asserts the droptrees exists
      let droptrees = get_droptrees_for_update(sender);
      
      //make sure the root and the droptree exists
      assert!(smart_table::contains(droptrees.trees,root),ERR_INVALID_ROOT);
      
      let droptree = smart_table::borrow_mut(droptrees.trees,root);
      //Take the left over deposits      
      let deposit_left = droptree.deposit_left;
      //assert there are deposits left
      assert!(deposit_left >0,ERR_DROPTREE_EMPTY);

      //Use the fungible store to withdraw the remaining deposits
      fungible_asset::transfer(
        &generate_fungible_store_signer(),
        droptree.deposit_store,
        //If the primary store doesn't exists, create it
        primary_fungible_store::ensure_primary_store_exists(
          sender_addr,droptree.fa_metadata_object
        ),
        deposit_left
      );

       // update the mutable reference to 0
       droptree.deposit_left = 0;
       
       //Disable the droptree
       droptree.enabled = false;

      //Emit the event that the drop tree was refunded
      
      event::emit(DropRefunded{
        sponsor: sender_addr,
        merkle_root: root
      })
    }
    

    //Claim a paydrop by proving the sender address is contained in the merkle root
    // The merkle root leaf is hash(sender address, withdraw amount),
    //The remaining arguments are a circom ZKP
    //TODO
    public entry fun claim_paydrop(sender: &signer) acquires DropTrees, FungibleStoreController,Config{}

    //TODO: Only owner functions to update the fee and the address that recieves the fee

    //TODO: Enable and disable the drop tree, only allow enable if there is deposit

    //Mutable Borrow an existing droptree or create a new one, returns the DropTrees and isNew
    fun get_or_create_droptree(
        fa_address: address, sender: address
    ): (&mut DropTrees, bool) acquires DropTrees {
        let store_signer = &generate_fungible_store_signer();
        if (exists<DropTrees>(sender)) {
            (get_droptrees_for_update(sender), false)
        } else {
            (DropTrees { trees: smart_table::new() }, true)
        }
    }


    #[view]
    // return the total number of drop rees per sponsor
    public fun total_droptrees(sponsor: address): u64 acquires DropTrees {
        let droptrees = get_droptrees(sponsor);
        smart_table::length(droptrees.trees)
    }

    #[view]
    //Returns the sponsors drop tree using the root hash
    public fun droptree_details(sponsor: address, root: u256): (u64, u64, u64, u64) acquires DropTrees {
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
    ): bool acquires DropTrees {
        let selected_tree = tree_selector(sponsor, root);
        //Returns if the nullifiers contains the recipient address
        smart_table::contains(&selected_tree.nullifiers, recipient)
    }

    inline fun tree_selector(sponsor: address, root: u256): DropTree {
        let droptrees = get_droptrees(sponsor);
        assert!(smart_table::contains(&droptrees.trees, root), EDROPTREE_NOT_FOUND);
        smart_table::borrow(&droptrees.trees, root)

    }

    inline fun get_droptrees(sponsor: address): DropTrees {
        assert!(exists<DropTrees>(sponsor), ESPONSOR_ACCOUNT_NOT_INITIALIZED);
        borrow_global<DropTrees>(sponsor)
    }

    inline fun get_droptrees_for_update(sponsor: address): &mut Droptrees {
        assert!(exists<DropTrees>(sponsor), ESPONSOR_ACCOUNT_NOT_INITIALIZED);
        borrow_global_mut<DropTrees>(sponsor)
    }

    // Generate signer to send value from fungible stores
    fun generate_fungible_store_signer(): Signer acquires FungibleStoreController {
        object::generate_signer_for_extending(
            &borrow_global<FungibleStoreController>(@paydrop_addr).extend_ref
        )
    }
}
