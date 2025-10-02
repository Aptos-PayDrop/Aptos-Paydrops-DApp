require("dotenv").config();

const cli = require("@aptos-labs/ts-sdk/dist/common/cli/index.js");

async function test() {
  const move = new cli.Move();

  await move.test({
    packageDirectoryPath: "contract",
     namedAddresses: {
        deployer_wallet_address: process.env.VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS,
        paydrop_addr: process.env.VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS
      },
  });
}
test();
