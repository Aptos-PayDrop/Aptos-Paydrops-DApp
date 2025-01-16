pragma circom 2.0.0;
include "./merkletree.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

//Aptos paydrop circuit
//The commitment hash is hash(address,amount)
//There is no nullifier, the nullification happens on-chain using the address
//The merkle tree contains leaves with hash(address,amount)
//Only the merkle proof is private but it's not a privacy, it's a scaling solution

template AddressAmountMerkleTreeChecker(levels){
    // Public inputs

    signal input address; //It's actually a ripemd160 hash
    signal input amount;

    signal input root;
    signal input pathElements[levels]; // The merkle proof which is fixed size, pathElements contains the hashes
    signal input pathIndices[levels]; // Indices encode if we hash left or right


    component commitmentHasher = Poseidon(2);

    commitmentHasher.inputs[0] <== address;
    commitmentHasher.inputs[1] <== amount;

        
    // Check if the merkle root contains the commitmentHash!
    component tree = MerkleTreeChecker(levels);

    tree.leaf <== commitmentHasher.out;
    tree.root <== root;

    for (var i = 0; i < levels; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }


}

component main {public [address,amount,root]} = AddressAmountMerkleTreeChecker(20);
