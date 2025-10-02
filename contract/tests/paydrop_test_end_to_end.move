#[test_only]
module paydrop_addr::test_end_to_end {
    use std::signer;
    use std::option;
    use std::string;
    use std::vector;
    use std::string::{utf8};
    use aptos_framework::fungible_asset::{Self, Metadata};
    use aptos_framework::object;
    use aptos_framework::primary_fungible_store;

    use paydrop_addr::paydrop;

    #[
        test(
            sender = @0x1278fc8a6671b9cc775809a48d26a4cf5fc8ac10005edfadbe1b65d299b016b0,
            droptree_creator = @0x100,
            drop_claimer1 =
            @0x7e8ef4d931b6f7f55c2cfe73483d1bd4c1440d6cefb03815984ac8cb059e2927,
            drop_claimer2 =
            @0x7b97adb9c6fb626ac5ca2523f9677f4f08664a2046452111313ad1a1d6c45374,
            fee_manager = @0x1278fc8a6671b9cc775809a48d26a4cf5fc8ac10005edfadbe1b65d299b016b0
        )
    ]
    fun test_create_and_refund_droptree(
        sender: &signer,
        droptree_creator: &signer,
        drop_claimer1: &signer,
        drop_claimer2: &signer,
        fee_manager: &signer
    ) {
        let sender_addr = signer::address_of(sender);
        let fee_manager_addr = signer::address_of(fee_manager);
        let droptree_creator_addr = signer::address_of(droptree_creator);

        let deposit_amount = 100;

        // Create an imaginary token an mint some to the droptree creator

        let fa_obj_constructor_ref = &object::create_sticky_object(sender_addr);

        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            fa_obj_constructor_ref,
            option::none(),
            string::utf8(b"test FA for depositing"),
            string::utf8(b"TFAD"),
            8,
            string::utf8(b"url"),
            string::utf8(b"url")
        );

        let fa_metadata_object =
            object::object_from_constructor_ref<Metadata>(fa_obj_constructor_ref);
        primary_fungible_store::mint(
            &fungible_asset::generate_mint_ref(fa_obj_constructor_ref),
            droptree_creator_addr,
            deposit_amount
        );

        // //I assert that the droptree creator has 100 deposit
        let creator_balance_1 =
            primary_fungible_store::balance(droptree_creator_addr, fa_metadata_object);

        assert!(creator_balance_1 == 100);

        // I need an init_module_for_test to create the paydrop contract module
        paydrop::init_module_for_test(sender, fee_manager_addr);

        //Then set the fees to 1%
        paydrop::set_fee(sender, 1);

        //Set the fee manager
        paydrop::set_fee_manager(sender, fee_manager_addr);

        let root: u256 =
            777978031488136730761170329647423808035367613036518254081653041904670814908;

        //create a droptree that is disabled
        paydrop::new_droptree_for_test(
            droptree_creator,
            root,
            fa_metadata_object,
            deposit_amount,
            2,
            false,
            utf8(b"")
            
        );

        creator_balance_1 = primary_fungible_store::balance(
            droptree_creator_addr, fa_metadata_object
        );

        assert!(creator_balance_1 == 0);

        //get the droptree to see the details
        let (
            droptreeDetails_total_deposit,
            droptreeDetails_deposit_left,
            droptreeDetails_total_leaves,
            droptreeDetails_unused_leaves,
            _droptreeDetails_fa_metadata,
            droptreeDetails_enabled,
            _droptreeDetails_url
        ) = paydrop::droptree_details(droptree_creator_addr, root);

        assert!(droptreeDetails_total_deposit == 100);
        assert!(droptreeDetails_deposit_left == 100);
        assert!(droptreeDetails_total_leaves == 2);
        assert!(droptreeDetails_unused_leaves == 2);
        assert!(droptreeDetails_enabled == false);

        //enable the droptree
        paydrop::enable_droptree(droptree_creator, root);

        let (
            droptreeDetails_total_deposit,
            droptreeDetails_deposit_left,
            droptreeDetails_total_leaves,
            droptreeDetails_unused_leaves,
            _droptreeDetails_fa_metadata,
            droptreeDetails_enabled,
            _url
        ) = paydrop::droptree_details(droptree_creator_addr, root);

        assert!(droptreeDetails_enabled);
        //refund the droptree

        paydrop::refund_droptree(droptree_creator, root);

        let (
            droptreeDetails_total_deposit,
            droptreeDetails_deposit_left,
            droptreeDetails_total_leaves,
            droptreeDetails_unused_leaves,
            _droptreeDetails_fa_metadata,
            droptreeDetails_enabled,
            _url
        ) = paydrop::droptree_details(droptree_creator_addr, root);

        assert!(droptreeDetails_total_deposit == 100);
        assert!(droptreeDetails_deposit_left == 0);
        assert!(droptreeDetails_total_leaves == 2);
        assert!(droptreeDetails_unused_leaves == 2);
        assert!(droptreeDetails_enabled == false);

        let creator_balance_1 =
            primary_fungible_store::balance(droptree_creator_addr, fa_metadata_object);

        assert!(creator_balance_1 == 100);

        //DONE,BALANCE REFUNDED, THE DROPTREE IS NOT ACTIVE

    }
    #[test_only]
    use aptos_std::crypto_algebra::{ enable_cryptography_algebra_natives};

    #[
        test(
            aptos_framework = @0x1,
            sender = @0x1278fc8a6671b9cc775809a48d26a4cf5fc8ac10005edfadbe1b65d299b016b0,
            droptree_creator = @0x100,
            drop_claimer1 =
            @0xa84b5df0681d7572218e67c1a7f601cf0a6762732525e87fb7833dd7934aeb04,
            drop_claimer2 =
            @0x86608a323db743d03a4e48b939654648ee719a53449223dfbc75412d1f6d54e3,
            fee_manager = @0x1278fc8a6671b9cc775809a48d26a4cf5fc8ac10005edfadbe1b65d299b016b0
        )
    ]
    fun test_claimDropt(
        aptos_framework: &signer,
        sender: &signer,
        droptree_creator: &signer,
        drop_claimer1: &signer,
        drop_claimer2: &signer,
        fee_manager: &signer
    ) {
        enable_cryptography_algebra_natives(aptos_framework);

        let sender_addr = signer::address_of(sender);
        let fee_manager_addr = signer::address_of(fee_manager);
        let droptree_creator_addr = signer::address_of(droptree_creator);
        let claimer_address = signer::address_of(drop_claimer1);

        let deposit_amount = 100;

        // I need an init_module_for_test to create the paydrop contract module
        paydrop::init_module_for_test(sender, fee_manager_addr);

        let vkey = vector::empty<u256>();

        //I need to initialize vkey
       let vk_alpha_x :u256 = 20491192805390485299153009773594534940189261866228447918068658471970481763042;
       let vk_alpha_y :u256 = 9383485363053290200918347156157836566562967994039712273449902621266178545958;
    
       let vk_beta_x1 :u256 = 6375614351688725206403948262868962793625744043794305715222011528459656738731;
       let vk_beta_y1 :u256 = 4252822878758300859123897981450591353533073413197771768651442665752259397132;
       let vk_beta_x2 :u256 = 10505242626370262277552901082094356697409835680220590971873171140371331206856;
       let vk_beta_y2 :u256 = 21847035105528745403288232691147584728191162732299865338377159692350059136679;
    
       let vk_gamma_x1 :u256 =  10857046999023057135944570762232829481370756359578518086990519993285655852781;
       let vk_gamma_y1 :u256 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
       let vk_gamma_x2 :u256 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
       let vk_gamma_y2 :u256 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    
       let vk_delta_x1: u256 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
       let vk_delta_y1 :u256 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
       let vk_delta_x2 :u256 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
       let vk_delta_y2 :u256 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    
       let vk_gamma_abc_1_x :u256 = 21100001009097847930368540764760544570228053001245052724107207278112203330737;
       let vk_gamma_abc_1_y :u256 = 3584975079604962894877116260010020659032293822450252815573490167673157287389;
       let vk_gamma_abc_2_x :u256 = 3335542802458537161149997126639678666947349296571777155142215747605936167315;
       let vk_gamma_abc_2_y :u256 = 21370931123087716469873268697319133406331097626605986452732701805349099788264;
       let vk_gamma_abc_3_x :u256 = 19541301716815092158826794142986435448335876271095241632188392315687250715533;
       let vk_gamma_abc_3_y :u256 = 10385037319540012229157261457820828406675702659764403450770324761969119366673;
       let vk_gamma_abc_4_x :u256 = 6347248123138705872504191422457776981863675765576488832672040451282071973556;
       let vk_gamma_abc_4_y :u256 = 12125101313636424779251754881838752768850419735254440705008986776913564966585;
       let vk_gamma_abc_5_x :u256 = 7258235939731137943640740965784426713591402290852055372956675435355506762793;
       let vk_gamma_abc_5_y :u256 = 18433128282133225485602978902885775425659885032894430577092514628791345858079;

        vector::push_back<u256>(&mut vkey, vk_alpha_x);
        vector::push_back<u256>(&mut vkey, vk_alpha_y);
        vector::push_back<u256>(&mut vkey, vk_beta_x1);
        vector::push_back<u256>(&mut vkey, vk_beta_y1);
        vector::push_back<u256>(&mut vkey, vk_beta_x2);
        vector::push_back<u256>(&mut vkey, vk_beta_y2);
        vector::push_back<u256>(&mut vkey, vk_gamma_x1);
        vector::push_back<u256>(&mut vkey, vk_gamma_y1);
        vector::push_back<u256>(&mut vkey, vk_gamma_x2);
        vector::push_back<u256>(&mut vkey, vk_gamma_y2);
        vector::push_back<u256>(&mut vkey, vk_delta_x1);
        vector::push_back<u256>(&mut vkey, vk_delta_y1);
        vector::push_back<u256>(&mut vkey, vk_delta_x2);
        vector::push_back<u256>(&mut vkey, vk_delta_y2);

        vector::push_back<u256>(&mut vkey, vk_gamma_abc_1_x);
        vector::push_back<u256>(&mut vkey, vk_gamma_abc_1_y);
        vector::push_back<u256>(&mut vkey, vk_gamma_abc_2_x);
        vector::push_back<u256>(&mut vkey, vk_gamma_abc_2_y);
        vector::push_back<u256>(&mut vkey, vk_gamma_abc_3_x);
        vector::push_back<u256>(&mut vkey, vk_gamma_abc_3_y);
        vector::push_back<u256>(&mut vkey, vk_gamma_abc_4_x);
        vector::push_back<u256>(&mut vkey, vk_gamma_abc_4_y);
        vector::push_back<u256>(&mut vkey, vk_gamma_abc_5_x);
        vector::push_back<u256>(&mut vkey, vk_gamma_abc_5_y);
        //Save the Vkey
        paydrop::initialize_vkey(sender, vkey);

        let sender_addr = signer::address_of(sender);
        let fee_manager_addr = signer::address_of(fee_manager);
        let droptree_creator_addr = signer::address_of(droptree_creator);

        // Create an imaginary token an mint some to the droptree creator

        let fa_obj_constructor_ref = &object::create_sticky_object(sender_addr);

        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            fa_obj_constructor_ref,
            option::none(),
            string::utf8(b"test FA for depositing"),
            string::utf8(b"TFAD"),
            8,
            string::utf8(b"url"),
            string::utf8(b"url")
        );

        let fa_metadata_object =
            object::object_from_constructor_ref<Metadata>(fa_obj_constructor_ref);
        primary_fungible_store::mint(
            &fungible_asset::generate_mint_ref(fa_obj_constructor_ref),
            droptree_creator_addr,
            deposit_amount
        );

        // //I assert that the droptree creator has 100 deposit
        let creator_balance_1 =
            primary_fungible_store::balance(droptree_creator_addr, fa_metadata_object);

        assert!(creator_balance_1 == 100);

        //Then set the fees to 1%
        paydrop::set_fee(sender, 1);

        //Set the fee manager
        paydrop::set_fee_manager(sender, fee_manager_addr);

        let root: u256 =
            2985685491180130710183965402272699585428554319561108891139340448149597446003;

        //create a droptree that is disabled
        paydrop::new_droptree_for_test(
            droptree_creator,
            root,
            fa_metadata_object,
            deposit_amount,
            2,
            true,
            utf8(b"")
        );

        //Check if an address is nullfied

       let claimerNullified = paydrop::is_nullified(droptree_creator_addr, root,claimer_address);

       assert!(!claimerNullified);


        // claim a drop from a tree
        let proof = vector::empty();
        let a_x: u256 = 1331715864425932513326850596786746336644056006656421178687142765911591792318;
        let a_y: u256 = 12787763696843480683752397109324102961941308947156479318678409936760811476365;
        let b_x1: u256 =19562262041410713807993942613556559128725814903729306204428467815091789798201;
        let b_y1: u256 =2291935864568264110584764972903817721807107684448140050161203436865237847771;
        let b_x2: u256 =6303271992358205177669465945179268358465791939465144321814809944156687244954;
        let b_y2: u256 =10762790685816118944141428330102602000309291916359255563112811919539935444754;
        let c_x: u256 = 893477262973342135475647485741087606963105850502938610218736887168492312147;
        let c_y: u256 = 16000897160170057091661851469237234975757297147268337982089937031676314453527;

        vector::push_back<u256>(&mut proof, a_x);
        vector::push_back<u256>(&mut proof, a_y);
        vector::push_back<u256>(&mut proof, b_x1);
        vector::push_back<u256>(&mut proof, b_y1);
        vector::push_back<u256>(&mut proof, b_x2);
        vector::push_back<u256>(&mut proof, b_y2);
        vector::push_back<u256>(&mut proof, c_x);
        vector::push_back<u256>(&mut proof, c_y);

       let nonce = 138597043049747605410110486986447623483987708681682193209124452267061687216;

        paydrop::claim_paydrop(drop_claimer1,droptree_creator_addr,root,10,nonce,proof);

        //test if the address got nullified now

       let claimerNullified = paydrop::is_nullified(droptree_creator_addr, root,claimer_address);

       assert!(claimerNullified);

        //test the balances of the account 
        let claimer_balance = primary_fungible_store::balance(claimer_address,fa_metadata_object);
        
        assert!(claimer_balance == 10);

        let (
            droptreeDetails_total_deposit,
            droptreeDetails_deposit_left,
            droptreeDetails_total_leaves,
            droptreeDetails_unused_leaves,
            droptreeDetails_fa_metadata,
            droptreeDetails_enabled,
            url
        ) = paydrop::droptree_details(droptree_creator_addr, root);

        assert!(droptreeDetails_total_deposit == deposit_amount);
        assert!(droptreeDetails_deposit_left == 90);
        assert!(droptreeDetails_total_leaves == 2);
        assert!(droptreeDetails_unused_leaves == 1);
        assert!(droptreeDetails_enabled == true);


    }

    //TODO: make a test when you got 2 claims

    //This function just creates a contract and tests setting the fees
    #[test(sender = @0x1278fc8a6671b9cc775809a48d26a4cf5fc8ac10005edfadbe1b65d299b016b0, fee_manager = @0x1278fc8a6671b9cc775809a48d26a4cf5fc8ac10005edfadbe1b65d299b016b0)]
    fun test_fees(sender: &signer, fee_manager: &signer) {
        let sender_addr = signer::address_of(sender);
        let fee_manager_addr = signer::address_of(fee_manager);

        paydrop::init_module_for_test(sender, fee_manager_addr);

        //There should be zero fee
        let fee = paydrop::get_fee();
        assert!(fee == 0);
        //the sender and the fee_manager are the same because otherwise set_fee throws now
        paydrop::set_fee(sender, 4);

        fee = paydrop::get_fee();
        assert!(fee == 4);

        let (finalAmount, fee) = paydrop::calculate_fees(100);
        assert!(finalAmount == 96);
        assert!(fee == 4);

        paydrop::set_fee(sender, 1);
        let (newFinal, newFee) = paydrop::calculate_fees(666);
        assert!(newFinal == 660);
        assert!(newFee == 6);
    }

    //TODO: make all the error tests! Assert that the errors occur
}
//  console.log
//     [
//       '0xa84b5df0681d7572218e67c1a7f601cf0a6762732525e87fb7833dd7934aeb04',
//       '0x86608a323db743d03a4e48b939654648ee719a53449223dfbc75412d1f6d54e3'
//     ]

//       at log (test/input.js:16:13)

//   console.log
//     389356124771413759786369704681681747948361100026681775993044599482892905195n

//       at Object.log (test/index.test.js:11:13)

//   console.log
//     root 2985685491180130710183965402272699585428554319561108891139340448149597446003n

//       at Object.log (test/index.test.js:12:13)

//   console.log
    
//        let vk_alpha_x :u256 = 20491192805390485299153009773594534940189261866228447918068658471970481763042;
//        let vk_alpha_y :u256 = 9383485363053290200918347156157836566562967994039712273449902621266178545958;
    
//        let vk_beta_x1 :u256 = 6375614351688725206403948262868962793625744043794305715222011528459656738731;
//        let vk_beta_y1 :u256 = 4252822878758300859123897981450591353533073413197771768651442665752259397132;
//        let vk_beta_x2 :u256 =  10505242626370262277552901082094356697409835680220590971873171140371331206856;
//        let vk_beta_y2 :u256 = 21847035105528745403288232691147584728191162732299865338377159692350059136679;
    
//        let vk_gamma_x1 :u256 =  10857046999023057135944570762232829481370756359578518086990519993285655852781;
//        let vk_gamma_y1 :u256 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
//        let vk_gamma_x2 :u256 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
//        let vk_gamma_y2 :u256 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    
//        let vk_delta_x1: u256 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
//        let vk_delta_y1 :u256 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
//        let vk_delta_x2 :u256 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
//        let vk_delta_y2 :u256 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    
//        let vk_gamma_abc_1_x :u256 = 21100001009097847930368540764760544570228053001245052724107207278112203330737;
//        let vk_gamma_abc_1_y :u256 = 3584975079604962894877116260010020659032293822450252815573490167673157287389;
//        let vk_gamma_abc_2_x :u256 = 3335542802458537161149997126639678666947349296571777155142215747605936167315;
//        let vk_gamma_abc_2_y :u256 = 21370931123087716469873268697319133406331097626605986452732701805349099788264;
//        let vk_gamma_abc_3_x :u256 = 19541301716815092158826794142986435448335876271095241632188392315687250715533;
//        let vk_gamma_abc_3_y :u256 = 10385037319540012229157261457820828406675702659764403450770324761969119366673;
//        let vk_gamma_abc_4_x :u256 = 6347248123138705872504191422457776981863675765576488832672040451282071973556;
//        let vk_gamma_abc_4_y :u256 = 12125101313636424779251754881838752768850419735254440705008986776913564966585;
//        let vk_gamma_abc_5_x :u256 = 7258235939731137943640740965784426713591402290852055372956675435355506762793;
//        let vk_gamma_abc_5_y :u256 = 18433128282133225485602978902885775425659885032894430577092514628791345858079;

//       at log (test/index.test.js:44:13)
//   console.log
    
            // let a_x: u256 = 1331715864425932513326850596786746336644056006656421178687142765911591792318;
            // let a_y: u256 = 12787763696843480683752397109324102961941308947156479318678409936760811476365;
            // let b_x1: u256 =19562262041410713807993942613556559128725814903729306204428467815091789798201;
            // let b_y1: u256 =2291935864568264110584764972903817721807107684448140050161203436865237847771;
            // let b_x2: u256 =6303271992358205177669465945179268358465791939465144321814809944156687244954;
            // let b_y2: u256 =10762790685816118944141428330102602000309291916359255563112811919539935444754;
            // let c_x: u256 = 893477262973342135475647485741087606963105850502938610218736887168492312147;
            // let c_y: u256 = 16000897160170057091661851469237234975757297147268337982089937031676314453527;

//       at log (test/index.test.js:73:13)

//   console.log
//     ["389356124771413759786369704681681747948361100026681775993044599482892905195","10","138597043049747605410110486986447623483987708681682193209124452267061687216","2985685491180130710183965402272699585428554319561108891139340448149597446003"]

//       at log (test/index.test.js:84:13)

//   console.log
//     {"pi_a":["1331715864425932513326850596786746336644056006656421178687142765911591792318","12787763696843480683752397109324102961941308947156479318678409936760811476365","1"],"pi_b":[["19562262041410713807993942613556559128725814903729306204428467815091789798201","2291935864568264110584764972903817721807107684448140050161203436865237847771"],["6303271992358205177669465945179268358465791939465144321814809944156687244954","10762790685816118944141428330102602000309291916359255563112811919539935444754"],["1","0"]],"pi_c":["893477262973342135475647485741087606963105850502938610218736887168492312147","16000897160170057091661851469237234975757297147268337982089937031676314453527","1"],"protocol":"groth16","curve":"bn128"}
