declare global {
  interface Window {
    // EIP-1193 provider (e.g. MetaMask)
    ethereum?: import('ethers').Eip1193Provider;
  }
}

export {};


