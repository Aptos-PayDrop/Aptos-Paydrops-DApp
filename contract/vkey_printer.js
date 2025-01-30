//This is a script that will output the script to update the vkey
const fs = require("fs");

//This prints the vkey in a vector to call initialize_vkey with
//I just used the explorer to call this function on the contract

function main() {
 

    const verificationKeyFile = fs.readFileSync("../../circom/circuits/compiled/verification_key.json");
    const vkey = JSON.parse(verificationKeyFile);

    const array = [
        vkey.vk_alpha_1[0],
        vkey.vk_alpha_1[1],
        vkey.vk_beta_2[0][0],
        vkey.vk_beta_2[0][1],
        vkey.vk_beta_2[1][0],
        vkey.vk_beta_2[1][1],
        vkey.vk_gamma_2[0][0],
        vkey.vk_gamma_2[0][1],
        vkey.vk_gamma_2[1][0],
        vkey.vk_gamma_2[1][1],
        vkey.vk_delta_2[0][0],
        vkey.vk_delta_2[0][1],
        vkey.vk_delta_2[1][0],
        vkey.vk_delta_2[1][1],
        vkey.IC[0][0],
        vkey.IC[0][1],
        vkey.IC[1][0],
        vkey.IC[1][1],
        vkey.IC[2][0],
        vkey.IC[2][1],
        vkey.IC[3][0],
        vkey.IC[3][1],
        vkey.IC[4][0],
        vkey.IC[4][1],
    ]

    console.log(JSON.stringify(array))
}



main();