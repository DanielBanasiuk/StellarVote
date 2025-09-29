"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FaSearch } from "react-icons/fa";
import { ethers } from "ethers";
import { StellarVoteCoreABI } from "@/abi/StellarVoteCoreABI";
import { StellarVoteCoreAddresses } from "@/abi/StellarVoteCoreAddresses";
import { decryptAggregate } from "@/fhevm/adapter";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type Published = {
  proposalId: number;
  counts: number[];
  proof: string;
  ts: number;
};

export default function ResultsPage() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<number | undefined>();
  const [queryId, setQueryId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [options, setOptions] = useState<string[]>([]);
  const [result, setResult] = useState<Published | null>(null);
  const [decCounts, setDecCounts] = useState<number[] | null>(null);

  const contract = useMemo(() => {
    if (!provider || !chainId) return null;
    const info = (StellarVoteCoreAddresses as any)[String(chainId)];
    const addr: string | undefined = info?.address;
    const isValid = typeof addr === "string" && /^0x[a-fA-F0-9]{40}$/.test(addr);
    if (!isValid) return null;
    return new ethers.Contract(addr, (StellarVoteCoreABI as any).abi, provider);
  }, [provider, chainId]);

  useEffect(() => {
    (async () => {
      if (!window?.ethereum) return;
      const bp = new ethers.BrowserProvider(window.ethereum);
      setProvider(bp);
      const net = await bp.getNetwork();
      setChainId(Number(net.chainId));
      // prefill from ?id=
      try {
        const sp = new URLSearchParams(window.location.search);
        const pre = sp.get("id");
        if (pre) setQueryId(pre);
      } catch {}
    })();
  }, []);

  const search = async () => {
    setError("");
    setResult(null);
    setOptions([]);
    setTitle("");
    if (!contract) {
      setError("合约未就绪或未连接正确网络");
      return;
    }
    const idNum = Number(queryId);
    if (!Number.isFinite(idNum) || idNum <= 0) {
      setError("请输入有效的提案ID（正整数）");
      return;
    }
    setLoading(true);
    try {
      const [name, _desc, opts, _start, _end, published] = await (contract as any).getProposalDetails(idNum);
      setTitle(name);
      setOptions(opts);
      // 若未公布，不报错，继续尝试本地解密；若已公布则读取官方结果
      // 读取加密聚合以便尝试解密（如果未公布或你想本地验证）
      let data: Published | null = null;
      if (published) {
        const pub = await (contract as any).getPublishedResults(idNum);
        data = {
          proposalId: Number(pub.proposalId ?? idNum),
          counts: (pub.tallies as any[]).map((x) => Number(x)),
          proof: String(pub.verificationProof ?? ""),
          ts: Number(pub.revealTime ?? 0),
        };
        setResult(data);
      } else {
        setResult(null);
      }

      // 尝试从链上取回密文handles做本地解密：合约 `encryptedAggregateOf`
      try {
        const enc = await (contract as any).encryptedAggregateOf(idNum);
        if (!provider) throw new Error("钱包未就绪");
        const signer = await provider.getSigner();
        const user = await signer.getAddress();
        const info: any = (StellarVoteCoreAddresses as any)[String(chainId)];
        const addr: `0x${string}` = info.address;
        // enc 是 external句柄数组，SDK 需要 bytes32[] 字符串
        const handles: string[] = enc.map((e: any) => String(e));
        const dec = await decryptAggregate({
          contractAddress: addr,
          encHandles: handles,
          userAddress: user as `0x${string}`,
          chainId: Number(chainId),
          provider,
        });
        setDecCounts(dec);
      } catch {}
    } catch (e: any) {
      setError(e?.message || "查询失败");
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    const counts = decCounts ?? result?.counts;
    if (!counts || options.length === 0) return null;
    return {
      labels: options.map((_, i) => String.fromCharCode(65 + i)),
      datasets: [
        {
          label: "票数",
          data: counts,
          backgroundColor: [
            "rgba(139, 92, 246, 0.6)",
            "rgba(59, 130, 246, 0.6)",
            "rgba(16, 185, 129, 0.6)",
            "rgba(245, 158, 11, 0.6)",
            "rgba(244, 63, 94, 0.6)",
          ],
          borderRadius: 8,
        },
      ],
    } as const;
  }, [result, decCounts, options]);

  const winner = useMemo(() => {
    const counts = decCounts ?? result?.counts;
    if (!counts || counts.length === 0) return null;
    let m = -1;
    let idx = -1;
    counts.forEach((v, i) => {
      if (v > m) {
        m = v;
        idx = i;
      }
    });
    if (idx === -1) return null;
    return { idx, value: m, label: options[idx] ?? `选项${String.fromCharCode(65 + idx)}` };
  }, [result, decCounts, options]);

  return (
    <div className="space-y-8">
      <motion.div
        className="stellar-page-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="stellar-page-title">结果查询</h1>
        <p className="stellar-page-subtitle">查看已公布的投票结果和统计数据</p>
      </motion.div>

      <motion.div
        className="stellar-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="flex gap-3">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="输入提案ID（数字）..."
              className="stellar-input pl-10"
              value={queryId}
              onChange={(e) => setQueryId(e.target.value)}
            />
          </div>
          <button onClick={search} className="cosmic-button-primary px-6">查询</button>
        </div>
      </motion.div>

      <motion.div
        className="stellar-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {loading ? (
          <div className="text-center text-gray-600">加载中...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : !result && !decCounts ? (
          <div className="text-center text-gray-500">请输入提案ID查询（若未公布，我们会尝试使用您的钱包解密本地可见的同态聚合）</div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">#{result?.proposalId ?? queryId} {title}</h3>
                {result?.ts ? (
                  <div className="text-sm text-gray-500 mt-1">公布时间：{new Date(result.ts * 1000).toLocaleString("zh-CN")}</div>
                ) : (
                  <div className="text-sm text-blue-600 mt-1">未公布（已使用您的钱包完成本地解密统计）</div>
                )}
              </div>
              {winner && (
                <div className="stellar-badge stellar-badge-published">胜出：{String.fromCharCode(65 + winner.idx)}（{winner.value} 票）</div>
              )}
            </div>

            {chartData && (
              <div className="bg-white/70 rounded-xl p-4">
                <Bar
                  data={chartData as any}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false }, title: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
                  }}
                />
              </div>
            )}

            <div className="text-sm text-gray-600">
              <div className="font-medium mb-1">结果摘要</div>
              <div className="grid md:grid-cols-2 gap-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md text-white flex items-center justify-center text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-gray-800">{opt}</span>
                    </div>
                    <span className="text-gray-700">{(decCounts ?? result?.counts ?? [])[i] ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>

            {result?.proof && (
              <div className="text-xs text-gray-500 break-all">
                证明: {result.proof}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
