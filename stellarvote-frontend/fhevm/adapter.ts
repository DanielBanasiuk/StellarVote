import { ethers } from "ethers";

async function ensurePolyfills() {
  if (typeof globalThis.global === "undefined") (globalThis as any).global = globalThis;
  if (typeof (globalThis as any).Buffer === "undefined") {
    const { Buffer } = await import("buffer");
    (globalThis as any).Buffer = Buffer;
  }
}

async function fetchRelayerKeys() {
  const base = "https://relayer.testnet.zama.cloud";
  const keyurlRes = await fetch(`${base}/v1/keyurl`, { cache: "no-store" });
  if (!keyurlRes.ok) throw new Error(`keyurl status ${keyurlRes.status}`);
  const data = await keyurlRes.json();
  const info = data?.response?.fhe_key_info?.[0];
  const crsInfo = data?.response?.crs?.["2048"];
  if (!info || !crsInfo) throw new Error("unexpected relayer response");

  const publicKeyId: string = info.fhe_public_key?.data_id;
  const publicKeyUrl: string = info.fhe_public_key?.urls?.[0];
  const publicParamsId: string = crsInfo?.data_id;
  const publicParamsUrl: string = crsInfo?.urls?.[0];

  if (!publicKeyId || !publicKeyUrl || !publicParamsId || !publicParamsUrl) {
    throw new Error("missing key urls");
  }

  const [pkRes, crsRes] = await Promise.all([
    fetch(publicKeyUrl, { cache: "no-store" }),
    fetch(publicParamsUrl, { cache: "no-store" }),
  ]);
  if (!pkRes.ok || !crsRes.ok) {
    throw new Error(`key fetch failed ${pkRes.status}/${crsRes.status}`);
  }

  const pkBuf = new Uint8Array(await pkRes.arrayBuffer());
  const crsBuf = new Uint8Array(await crsRes.arrayBuffer());

  return {
    publicKeyId,
    publicKeyB64: (globalThis as any).Buffer.from(pkBuf).toString("base64"),
    publicParamsId,
    publicParams2048B64: (globalThis as any).Buffer.from(crsBuf).toString("base64"),
  };
}

export async function encryptOneHot(params: {
  contractAddress: `0x${string}`;
  userAddress: string;
  onehot: number[];
  chainId: number;
  provider: ethers.BrowserProvider;
}) {
  await ensurePolyfills();
  const { createInstance, SepoliaConfig, initSDK } = await import("@zama-fhe/relayer-sdk/web");
  await initSDK();
  const useRelayer = params.chainId === 11155111;
  let client: any;
  if (useRelayer) {
    const j = await fetchRelayerKeys();
    client = await createInstance({
      aclContractAddress: SepoliaConfig.aclContractAddress,
      kmsContractAddress: SepoliaConfig.kmsContractAddress,
      inputVerifierContractAddress: SepoliaConfig.inputVerifierContractAddress,
      verifyingContractAddressDecryption: SepoliaConfig.verifyingContractAddressDecryption,
      verifyingContractAddressInputVerification: SepoliaConfig.verifyingContractAddressInputVerification,
      relayerUrl: SepoliaConfig.relayerUrl,
      chainId: 11155111,
      gatewayChainId: SepoliaConfig.gatewayChainId,
      network: SepoliaConfig.network,
      publicKey: {
        id: j.publicKeyId,
        data: Uint8Array.from((globalThis as any).Buffer.from(j.publicKeyB64, "base64")),
      },
      publicParams: {
        2048: {
          publicParams: Uint8Array.from((globalThis as any).Buffer.from(j.publicParams2048B64, "base64")),
          publicParamsId: j.publicParamsId,
        },
      },
    });
  } else {
    client = await createInstance(SepoliaConfig);
  }
  const input = client.createEncryptedInput(params.contractAddress, params.userAddress);
  for (const v of params.onehot) input.add32(v);
  return await input.encrypt();
}

export async function decryptAggregate(params: {
  contractAddress: `0x${string}`;
  encHandles: string[];
  userAddress: string;
  chainId: number;
  provider: ethers.BrowserProvider;
}) {
  await ensurePolyfills();
  const { createInstance, SepoliaConfig, initSDK } = await import("@zama-fhe/relayer-sdk/web");
  await initSDK();

  const now = Math.floor(Date.now() / 1000);
  const days = 365;

  let client: any;
  if (params.chainId === 11155111) {
    const j = await fetchRelayerKeys();
    client = await createInstance({
      aclContractAddress: SepoliaConfig.aclContractAddress,
      kmsContractAddress: SepoliaConfig.kmsContractAddress,
      inputVerifierContractAddress: SepoliaConfig.inputVerifierContractAddress,
      verifyingContractAddressDecryption: SepoliaConfig.verifyingContractAddressDecryption,
      verifyingContractAddressInputVerification: SepoliaConfig.verifyingContractAddressInputVerification,
      relayerUrl: SepoliaConfig.relayerUrl,
      chainId: 11155111,
      gatewayChainId: SepoliaConfig.gatewayChainId,
      network: SepoliaConfig.network,
      publicKey: {
        id: j.publicKeyId,
        data: Uint8Array.from((globalThis as any).Buffer.from(j.publicKeyB64, "base64")),
      },
      publicParams: {
        2048: {
          publicParams: Uint8Array.from((globalThis as any).Buffer.from(j.publicParams2048B64, "base64")),
          publicParamsId: j.publicParamsId,
        },
      },
    });
  } else {
    client = await createInstance(SepoliaConfig);
  }

  // 生成签名
  const { publicKey, privateKey } = client.generateKeypair();
  const eip = client.createEIP712(publicKey, [params.contractAddress], now, days);
  const signer = await params.provider.getSigner();
  const signature = await (signer as any).signTypedData(
    eip.domain,
    { UserDecryptRequestVerification: eip.types.UserDecryptRequestVerification },
    eip.message
  );

  const items = params.encHandles.map((h) => ({ handle: h, contractAddress: params.contractAddress }));
  const out = await client.userDecrypt(
    items,
    privateKey,
    publicKey,
    signature,
    [params.contractAddress],
    params.userAddress,
    now,
    days
  );
  // SDK 返回的 result 是 number[]，已解密的明文
  return out as number[];
}


