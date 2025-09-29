// 合约地址配置文件 - 自动更新
export const StellarVoteCoreAddresses = {
  "11155111": {
    "address": "0x376c2e95acb58Fa364D1315D60a743b760f5B46A",
    "blockNumber": 0
  }
} as const;

export type SupportedChainId = keyof typeof StellarVoteCoreAddresses;
