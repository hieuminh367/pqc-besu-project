import { Contract, Interface, type Provider } from "ethers";

const nativePqcAbi = [
  "function executeNativePQC(uint256 value)",
  "function counters(address owner) view returns (uint256)"
];
const nativePqcInterface = new Interface(nativePqcAbi);

export function buildExecuteNativePqcCall(
  contractAddress: string,
  contractValue: bigint
) {
  return {
    contractAddress,
    functionName: "executeNativePQC(uint256)",
    data: nativePqcInterface.encodeFunctionData("executeNativePQC", [contractValue])
  };
}

export async function readNativePqcCounter(
  provider: Provider,
  contractAddress: string,
  senderAddress: string
): Promise<bigint> {
  const contract = new Contract(contractAddress, nativePqcAbi, provider);
  return (await contract.counters(senderAddress)) as bigint;
}
