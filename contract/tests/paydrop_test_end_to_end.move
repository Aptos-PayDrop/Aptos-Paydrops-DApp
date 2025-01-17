#[test_only]
module paydrop_addr::test_end_to_end {
    use aptos_std::debug;
    use std::signer;
    use std::option;
    use std::string;
    use std::vector;

    use aptos_framework::fungible_asset::{Self, Metadata};
    use aptos_framework::object;
    use aptos_framework::primary_fungible_store;

    use paydrop_addr::paydrop;

    #[
        test(
            sender = @0x1,
            droptree_creator = @0x100,
            drop_claimer1 =
            @0x7e8ef4d931b6f7f55c2cfe73483d1bd4c1440d6cefb03815984ac8cb059e2927,
            drop_claimer2 =
            @0x7b97adb9c6fb626ac5ca2523f9677f4f08664a2046452111313ad1a1d6c45374,
            fee_manager = @0x1023
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
            false
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
            droptreeDetails_fa_metadata,
            droptreeDetails_enabled
        ) = paydrop::droptree_details(droptree_creator_addr, root);

        assert!(droptreeDetails_total_deposit == 100);
        assert!(droptreeDetails_deposit_left == 100);
        assert!(droptreeDetails_total_leaves == 2);
        assert!(droptreeDetails_unused_leaves == 2);
        assert!(droptreeDetails_enabled == false);
        debug::print(&droptreeDetails_fa_metadata);

        //enable the droptree
        paydrop::enable_droptree(droptree_creator, root);

        let (
            droptreeDetails_total_deposit,
            droptreeDetails_deposit_left,
            droptreeDetails_total_leaves,
            droptreeDetails_unused_leaves,
            droptreeDetails_fa_metadata,
            droptreeDetails_enabled
        ) = paydrop::droptree_details(droptree_creator_addr, root);

        assert!(droptreeDetails_enabled);
        //refund the droptree

        paydrop::refund_droptree(droptree_creator, root);

        let (
            droptreeDetails_total_deposit,
            droptreeDetails_deposit_left,
            droptreeDetails_total_leaves,
            droptreeDetails_unused_leaves,
            droptreeDetails_fa_metadata,
            droptreeDetails_enabled
        ) = paydrop::droptree_details(droptree_creator_addr, root);

        assert!(droptreeDetails_total_deposit == 100);
        assert!(droptreeDetails_deposit_left == 0);
        assert!(droptreeDetails_total_leaves == 2);
        assert!(droptreeDetails_unused_leaves == 2);
        assert!(droptreeDetails_enabled == false);

        let creator_balance_1 =
            primary_fungible_store::balance(droptree_creator_addr, fa_metadata_object);

        assert!(creator_balance_1 == 100);

        //DONE,BALANCE REFUNDED

        //create a droptree that is enabled

        //test droptree details

        //Test if an address is nullfied

        // claim a drop from a tree

        //test if the address got nullified now

        // try claiming the drop again with the same, should error

        // then claim all the drops

        // try to refund when it's empty
    }

    #[
        test(
            sender = @0x1,
            droptree_creator = @0x100,
            drop_claimer1 =
            @0x7e8ef4d931b6f7f55c2cfe73483d1bd4c1440d6cefb03815984ac8cb059e2927,
            drop_claimer2 =
            @0x7b97adb9c6fb626ac5ca2523f9677f4f08664a2046452111313ad1a1d6c45374,
            fee_manager = @0x1023
        )
    ]
    fun test_claimDropt(
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

          // I need an init_module_for_test to create the paydrop contract module
        paydrop::init_module_for_test(sender, fee_manager_addr);

        let vkey = vector::empty<u256>();

        //I need to initialize vkey
        let vk_alpha_x: u256 =
            20491192805390485299153009773594534940189261866228447918068658471970481763042;
        let vk_alpha_y: u256 =
            9383485363053290200918347156157836566562967994039712273449902621266178545958;

        let vk_beta_x1: u256 =
            6375614351688725206403948262868962793625744043794305715222011528459656738731;
        let vk_beta_y1: u256 =
            4252822878758300859123897981450591353533073413197771768651442665752259397132;
        let vk_beta_x2: u256 =
            10505242626370262277552901082094356697409835680220590971873171140371331206856;
        let vk_beta_y2: u256 =
            21847035105528745403288232691147584728191162732299865338377159692350059136679;

        let vk_gamma_x1: u256 =
            10857046999023057135944570762232829481370756359578518086990519993285655852781;
        let vk_gamma_y1: u256 =
            11559732032986387107991004021392285783925812861821192530917403151452391805634;
        let vk_gamma_x2: u256 =
            8495653923123431417604973247489272438418190587263600148770280649306958101930;
        let vk_gamma_y2: u256 =
            4082367875863433681332203403145435568316851327593401208105741076214120093531;

        let vk_delta_x1: u256 =
            10857046999023057135944570762232829481370756359578518086990519993285655852781;
        let vk_delta_y1: u256 =
            11559732032986387107991004021392285783925812861821192530917403151452391805634;
        let vk_delta_x2: u256 =
            8495653923123431417604973247489272438418190587263600148770280649306958101930;
        let vk_delta_y2: u256 =
            4082367875863433681332203403145435568316851327593401208105741076214120093531;

        let vk_gamma_abc_1_x: u256 =
            8452850655606825858102243354669533117663864078419831513485206831486164176725;
        let vk_gamma_abc_1_y: u256 =
            314700499390588420998231423031948308141477230277976279314704927459650948970;
        let vk_gamma_abc_2_x: u256 =
            18762714179903655418506027480355146464639912630770555936585369723620324562861;
        let vk_gamma_abc_2_y: u256 =
            4703415087382328979107122129833505986266706559283477523050412100098657507322;
        let vk_gamma_abc_3_x: u256 =
            8111276981146781186995185449634228234167843746909943889246057492984922745287;
        let vk_gamma_abc_3_y: u256 =
            7426709444522122136319421726878818248910037216202193723918649279080605303988;
        let vk_gamma_abc_4_x: u256 =
            5474844158194980219501836721174187052431839751853698014039078659422852057300;
        let vk_gamma_abc_4_y: u256 =
            15991161589379382143671910032429667167340556706931996928133073277593304911521;

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
        //Save the Vkey
        paydrop::initialize_vkey(sender, vkey);

    }

    //This function just creates a contract and tests setting the fees
    #[test(sender = @0x1, fee_manager = @0x1023)]
    fun test_fees(sender: &signer, fee_manager: &signer) {
        let sender_addr = signer::address_of(sender);
        let fee_manager_addr = signer::address_of(fee_manager);

        paydrop::init_module_for_test(sender, fee_manager_addr);

        //There should be zero fee
        let fee = paydrop::get_fee();
        assert!(fee == 0);

        paydrop::set_fee(sender, 10);

        fee = paydrop::get_fee();
        assert!(fee == 10);

        let (finalAmount, fee) = paydrop::calculate_fees(100);
        assert!(finalAmount == 90);
        assert!(fee == 10);

        paydrop::set_fee(sender, 1);
        let (newFinal, newFee) = paydrop::calculate_fees(666);
        assert!(newFinal == 660);
        assert!(newFee == 6);
    }
}

// VKEy
// let vk_alpha_x: u256 =
//     20491192805390485299153009773594534940189261866228447918068658471970481763042;
// let vk_alpha_y :u256 = 9383485363053290200918347156157836566562967994039712273449902621266178545958;

//  let vk_beta_x1 :u256 = 6375614351688725206403948262868962793625744043794305715222011528459656738731;
// let vk_beta_y1 :u256 = 4252822878758300859123897981450591353533073413197771768651442665752259397132;
// let vk_beta_x2 :u256= 10505242626370262277552901082094356697409835680220590971873171140371331206856;
// let vk_beta_y2 :u256 = 21847035105528745403288232691147584728191162732299865338377159692350059136679;

// let vk_gamma_x1 :u256 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
// let vk_gamma_y1 :u256 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
// let vk_gamma_x2 :u256 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
// let vk_gamma_y2 : u256 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;

//  let vk_delta_x1: u256 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
// let vk_delta_y1 :u256 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
// let vk_delta_x2 :u256 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
// let vk_delta_y2 :u256 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;

// let vk_gamma_abc_1_x : u256 = 8452850655606825858102243354669533117663864078419831513485206831486164176725;
// let vk_gamma_abc_1_y :u256 = 314700499390588420998231423031948308141477230277976279314704927459650948970;
// let vk_gamma_abc_2_x :u256 = 18762714179903655418506027480355146464639912630770555936585369723620324562861;
// let vk_gamma_abc_2_y :u256 = 4703415087382328979107122129833505986266706559283477523050412100098657507322;
// let vk_gamma_abc_3_x :u256 = 8111276981146781186995185449634228234167843746909943889246057492984922745287;
// let vk_gamma_abc_3_y :u256 = 7426709444522122136319421726878818248910037216202193723918649279080605303988;
// let vk_gamma_abc_4_x :u256 = 5474844158194980219501836721174187052431839751853698014039078659422852057300;
// let vk_gamma_abc_4_y :u256 = 15991161589379382143671910032429667167340556706931996928133073277593304911521;

//THE ADDRESSES USED IN THE MERKLE TREE
//  [
//       '0x7e8ef4d931b6f7f55c2cfe73483d1bd4c1440d6cefb03815984ac8cb059e2927',
//       '0x7b97adb9c6fb626ac5ca2523f9677f4f08664a2046452111313ad1a1d6c45374'
//     ]
//     AMOUNT IS 10 FOR BOTH

// THIS IS THE BLAKE2B-256 to 248
//     0x73b36c18741a73c3dcde750530010289a09d85895d33ce6c02357573152059

//ROOT:
//   console.log
//     root 777978031488136730761170329647423808035367613036518254081653041904670814908n

//PROOF:
//   console.log
//     proof {"pi_a":["724198966434291501506097392482979575616468034141470938370672460454689432697","15724519065694297818304971732812165482164446545860983377755661774638131275695","1"],"pi_b":[["11458640240007678607479699067515442576031249077378197039656301390298312457192","9704860732247980470438976805724895357503549701402520777422538574108068822440"],["18921451137739279469987255456765017265526015295573294642422401192452354349076","8631090064411544479817768985710212561205134343468102930217630686215130865523"],["1","0"]],"pi_c":["1473480864012223720208237360150640462888467397643119969433182370842392753195","9101912362344797345884534753305419860980740551912857227036976530402261092406","1"],"protocol":"groth16","curve":"bn128"}

//       at Object.log (test/index.test.js:28:13)

//   console.log
//     [
//       '204425739295086900355206749385230362898896537817564699521140656294375792729',
//       '10',
//       '777978031488136730761170329647423808035367613036518254081653041904670814908'
//     ]
