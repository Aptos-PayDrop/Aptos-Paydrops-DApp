import { bytesToBigIntLE, AccountAddress, bigIntToBytesLE } from "@aptos-labs/ts-sdk";
import Blake2b from "blake2b-wasm";


async function main() {
    const addr = "0x781875ede4d35a4210e7768c67d92b368aa5a5bd7c5cf271fe1d8253533da08d"
    console.log(addr);
    const address = AccountAddress.from(addr);
    console.log(address.toString())
    let hash = await hashAddressForSnarkBUFF(address.bcsToBytes());

    console.log("hash buff",hash)

    // console.log(hash[0]);
   
    let byte = hash;

    let myInt_le =
            BigInt(byte[0]) + (BigInt(byte[1]) << 8n) + (BigInt(byte[2]) << 16n) + (BigInt(byte[3]) << 24n) + (BigInt(byte[4]) << 32n)
                + (BigInt(byte[5]) << 40n) + (BigInt(byte[6]) << 48n) + (BigInt(byte[7]) << 56n) + (BigInt(byte[8]) << 64n)
                + (BigInt(byte[9]) << 72n) + (BigInt(byte[10]) << 80n) + (BigInt(byte[11]) << 88n) + (BigInt(byte[12]) << 96n)
                + (BigInt(byte[13]) << 104n) + (BigInt(byte[14]) << 112n) + (BigInt(byte[15]) << 120n) + (BigInt(byte[16]) << 128n)
                + (BigInt(byte[17]) << 136n) + (BigInt(byte[18]) << 144n) + (BigInt(byte[19]) << 152n) + (BigInt(byte[20]) << 160n)
                + (BigInt(byte[21]) << 168n) + (BigInt(byte[22]) << 176n) + (BigInt(byte[23]) << 184n) + (BigInt(byte[24]) << 192n)
                + (BigInt(byte[25]) << 200n) + (BigInt(byte[26]) << 208n) + (BigInt(byte[27]) << 216n) + (BigInt(byte[28]) << 224n)
                + (BigInt(byte[29]) << 232n) + (BigInt(byte[30]) << 240n) 

    console.log(myInt_le)


    
    console.log(convertHashToBigInt(byte))

}

function convertHashToBigInt(byte){
let accumulator = BigInt(byte[0]);
    
    for(let i = 1; i < 31; i++){
        let shift = BigInt(i) * 8n;
        accumulator += BigInt(byte[i]) << shift;
    }
return accumulator;
}

export async function hashAddressForSnarkBUFF(address_bytes) {
    return new Promise(function (resolve, reject) {
        Blake2b.ready(function (err) {
            if (err) reject(err);

            //Hash the address_bytes
            const hashBuff = Blake2b().update(address_bytes).digest();
            //convert to 31 bytes by slicing off the last byte
            const hashSlice = hashBuff.slice(0, 31);
            //convert to hex string         
            // const hexSlice = Array.from(hashSlice).map((b) => b.toString(16).padStart(2, "0")).join("");

            resolve(hashSlice);
        })
    })
}



main().catch(err => {
    console.error(err)
    process.exitCode = 1;
})