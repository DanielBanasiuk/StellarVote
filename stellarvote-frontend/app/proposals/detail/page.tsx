"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { encryptOneHot } from "@/fhevm/adapter";
import { ethers } from "ethers";
import { StellarVoteCoreABI } from "@/abi/StellarVoteCoreABI";
import { StellarVoteCoreAddresses } from "@/abi/StellarVoteCoreAddresses";

interface ProposalDetail {
  id: number;
  title: string;
  description: string;
  choices: string[];
  startTimestamp: number;
  endTimestamp: number;
  resultsRevealed: boolean;
  creator: string;
  status: number; // 0 pending, 1 active, 2 ended, 3 published
}

export default function ProposalDetailPage() {
  const router = useRouter();
  const [proposalId, setProposalId] = useState<number>(0);

  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<number | undefined>();
  const [detail, setDetail] = useState<ProposalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [votePhase, setVotePhase] = useState<"idle" | "encrypt" | "sign" | "pending" | "success" | "error">("idle");
  const [voteMsg, setVoteMsg] = useState("");
  const [voteTx, setVoteTx] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [myCount, setMyCount] = useState<number | null>(null);
  const [maxPer, setMaxPer] = useState<number | null>(null);
  const [myAddr, setMyAddr] = useState<string | null>(null);

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
      if (!window?.ethereum) {
        setError("未检测到钱包，请安装或启用钱包");
        setLoading(false);
        return;
      }
      // 读取 ?id=
      try {
        const sp = new URLSearchParams(window.location.search);
        const pre = sp.get("id");
        if (pre) setProposalId(Number(pre));
      } catch {}
      const bp = new ethers.BrowserProvider(window.ethereum);
      setProvider(bp);
      const net = await bp.getNetwork();
      setChainId(Number(net.chainId));
      try {
        const s = await bp.getSigner();
        setMyAddr(await s.getAddress());
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!contract || !proposalId) return;
      setLoading(true);
      setError("");
      try {
        const [title, description, choices, startTs, endTs, resultsRevealed, creator] = await (contract as any).getProposalDetails(proposalId);
        const status = Number(await (contract as any).getProposalStatus(proposalId));
        setDetail({
          id: proposalId,
          title,
          description,
          choices,
          startTimestamp: Number(startTs),
          endTimestamp: Number(endTs),
          resultsRevealed,
          creator,
          status,
        });
      } catch (e: any) {
        setError(e?.message || "加载失败");
      } finally {
        setLoading(false);
      }
    })();
  }, [contract, proposalId]);

  useEffect(() => {
    (async () => {
      if (!contract || !proposalId || !myAddr) return;
      try {
        const cnt = Number(await (contract as any).getParticipantVoteCount(myAddr, proposalId));
        const max = Number(await (contract as any).getMaxVotesPerParticipant(proposalId));
        setMyCount(cnt);
        setMaxPer(max);
      } catch {}
    })();
  }, [contract, myAddr, proposalId, votePhase]);

  async function vote(index: number) {
    if (!detail) return;
    if (!contract || !provider || !chainId) {
      setError("合约或钱包未就绪");
      return;
    }
    try {
      setSubmitting(true);
      setSelectedIdx(index);
      setVotePhase("encrypt");
      setVoteMsg("正在加密您的选择...");
      const signer = await provider.getSigner();
      const user = (await signer.getAddress()) as `0x${string}`;
      const info: any = (StellarVoteCoreAddresses as any)[String(chainId)];
      const addr: `0x${string}` = info.address;
      const onehot = detail.choices.map((_, i) => (i === index ? 1 : 0));
      const encrypted = await encryptOneHot({
        contractAddress: addr,
        userAddress: user,
        onehot,
        chainId: Number(chainId),
        provider,
      });
      setVotePhase("sign");
      setVoteMsg("请在钱包中确认交易...");
      const tx = await (await signer).sendTransaction({ to: addr, data: (contract as any).interface.encodeFunctionData("submitEncryptedVector", [proposalId, encrypted.handles, encrypted.inputProof]) });
      setVotePhase("pending");
      setVoteMsg("交易已提交，等待确认...");
      setVoteTx(tx.hash);
      await tx.wait();
      setVotePhase("success");
      setVoteMsg("投票已提交成功！");
      router.refresh?.();
    } catch (e: any) {
      setError(e?.message || "投票失败");
      setVotePhase("error");
      setVoteMsg(e?.message || "投票失败");
    } finally {
      setSubmitting(false);
    }
  }

  const formatDate = (ts?: number) =>
    ts ? new Date(ts * 1000).toLocaleString("zh-CN") : "-";

  const statusInfo = (s?: number) => {
    switch (s) {
      case 0:
        return { text: "即将开始", badge: "stellar-badge-pending" };
      case 1:
        return { text: "进行中", badge: "stellar-badge-active" };
      case 2:
        return { text: "已结束", badge: "stellar-badge-ended" };
      case 3:
        return { text: "已公布", badge: "stellar-badge-published" };
      default:
        return { text: "-", badge: "" };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="stellar-page-title text-3xl">提案详情</h1>
          <p className="stellar-page-subtitle">查看并参与该提案</p>
        </div>
        <Link href="/proposals" className="cosmic-button-outline">返回列表</Link>
      </div>

      {loading ? (
        <div className="stellar-card stellar-loading">
          <div className="h-6 bg-gray-200 rounded w-1/3 shimmer"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mt-3 shimmer"></div>
        </div>
      ) : error ? (
        <div className="stellar-card text-red-600">{error}</div>
      ) : !detail ? (
        <div className="stellar-card">未找到该提案</div>
      ) : (
        <div className="stellar-card space-y-6">
          {votePhase !== "idle" && (
            <div
              className={`p-4 rounded-xl border ${
                votePhase === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : votePhase === "error"
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-blue-50 border-blue-200 text-blue-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {voteMsg}
                  {voteTx && (
                    <>
                      ；交易哈希：
                      <a
                        className="underline"
                        target="_blank"
                        rel="noreferrer"
                        href={`https://sepolia.etherscan.io/tx/${voteTx}`}
                      >
                        查看
                      </a>
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">{detail.title}</h2>
            <span className={`${statusInfo(detail.status).badge}`}>{statusInfo(detail.status).text}</span>
          </div>

          {detail.description && (
            <p className="text-gray-700 leading-relaxed">{detail.description}</p>
          )}

          <div>
            <h3 className="font-semibold text-gray-700 mb-2">选项</h3>
            <div className="space-y-2">
              {detail.choices.map((c, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold ${
                    idx % 4 === 0
                      ? "bg-gradient-to-r from-purple-500 to-pink-500"
                      : idx % 4 === 1
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                      : idx % 4 === 2
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                      : "bg-gradient-to-r from-orange-500 to-red-500"
                  }`}> {String.fromCharCode(65 + idx)} </div>
                  <span className="text-gray-800">{c}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>开始时间：{formatDate(detail.startTimestamp)}</div>
            <div>结束时间：{formatDate(detail.endTimestamp)}</div>
            <div>创建者：{detail.creator.slice(0, 6)}...{detail.creator.slice(-4)}</div>
            <div>
              我的进度：
              {myAddr ? (
                myCount !== null && maxPer !== null ? (
                  <span className="ml-1 stellar-badge stellar-badge-active">{myCount} / {maxPer}</span>
                ) : (
                  <span className="ml-1 text-gray-500">加载中...</span>
                )
              ) : (
                <span className="ml-1 text-gray-500">未连接钱包</span>
              )}
            </div>
          </div>

          <div className="cosmic-divider" />

          <div className="flex items-center gap-3">
            <Link href="/proposals" className="cosmic-button-outline">返回</Link>
            {detail.status === 1 && (
              <div className="flex gap-2">
                {detail.choices.map((c, idx) => {
                  const isActive = submitting && selectedIdx === idx;
                  return (
                    <button
                      key={idx}
                      disabled={submitting}
                      onClick={() => vote(idx)}
                      className={`cosmic-button-primary ${isActive ? "opacity-90" : ""}`}
                    >
                      {isActive ? (
                        <span className="inline-flex items-center">
                          <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0A12 12 0 000 12h4z"></path>
                          </svg>
                          {votePhase === "encrypt" && "加密中..."}
                          {votePhase === "sign" && "等待钱包..."}
                          {votePhase === "pending" && "上链中..."}
                          {votePhase === "success" && "已提交"}
                          {votePhase === "error" && "重试"}
                        </span>
                      ) : (
                        <>选择 {String.fromCharCode(65 + idx)}</>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
