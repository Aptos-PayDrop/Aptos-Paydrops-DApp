export const NETWORK = import.meta.env.VITE_APP_NETWORK ?? "testnet";
export const MODULE_ADDRESS = import.meta.env.VITE_MODULE_ADDRESS;
export const IS_DEV = Boolean(import.meta.env.DEV);
export const IS_PROD = Boolean(import.meta.env.PROD);
export const APTOS_API_KEY = import.meta.env.VITE_APTOS_API_KEY;
export const IS_CIRCUIT_FINALIZED = import.meta.env.CIRCUIT_FINALIZED;