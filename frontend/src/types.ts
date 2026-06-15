export type BackendHealth = {
  ok: boolean;
  service: string;
  envPath: string;
  besuRpcUrl: string;
  chainId: string;
  businessContractAddress: string;
  nativePqcContractAddress: string;
};
