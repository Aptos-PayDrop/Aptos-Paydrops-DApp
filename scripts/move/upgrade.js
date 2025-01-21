require("dotenv").config();
const cli = require("@aptos-labs/ts-sdk/dist/common/cli/index.js");
const aptosSDK = require("@aptos-labs/ts-sdk")

async function publish() {
  // Check VITE_MODULE_ADDRESS is set
  if (!process.env.VITE_MODULE_ADDRESS) {
    throw new Error(
      "VITE_MODULE_ADDRESS variable is not set, make sure you have published the module before upgrading it",
    );
  }    

  if (!process.env.VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS) {
    throw new Error(
      "VITE_MODULE_PUBLISHER_ACCOUNT_PRIVATE_KEY variable is not set, make sure you have set the publisher account address",
    );
  }

  const move = new cli.Move();

  move.upgradeObjectPackage({
    packageDirectoryPath: "contract",
    objectAddress: process.env.VITE_MODULE_ADDRESS,
    namedAddresses: {
        fee_manager_address: process.env.VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS,
        paydrop_addr: process.env.VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS
      },
    extraArguments: [`--private-key=${process.env.VITE_MODULE_PUBLISHER_ACCOUNT_PRIVATE_KEY}`,`--url=${aptosSDK.NetworkToNodeAPI[process.env.VITE_APP_NETWORK]}`],
  });
}
publish();
