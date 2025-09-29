"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ethers } from "ethers";
import { FaSearch, FaPlus, FaClock, FaFire, FaCheckCircle, FaEye } from "react-icons/fa";
import { StellarVoteCoreABI } from "@/abi/StellarVoteCoreABI";
import { StellarVoteCoreAddresses } from "@/abi/StellarVoteCoreAddresses";

interface Proposal {
  id: number;
  title: string;
  description: string;
  choices: string[];
  startTimestamp: number;
  endTimestamp: number;
  resultsRevealed: boolean;
  creator: string;
  status: number;
}

export default function ProposalsPage() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<number | undefined>();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'ended' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');

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
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (!contract) {
          setProposals([]);
          return;
        }
        const count = Number(await (contract as any).getTotalProposals());
        const data: Proposal[] = [];
        for (let i = 1; i <= count; i++) {
          const [title, description, choices, startTs, endTs, resultsRevealed, creator] = await (contract as any).getProposalDetails(i);
          const status = Number(await (contract as any).getProposalStatus(i));
          data.push({
            id: i,
            title,
            description,
            choices,
            startTimestamp: Number(startTs),
            endTimestamp: Number(endTs),
            resultsRevealed,
            creator,
            status,
          });
        }
        setProposals(data.reverse());
      } catch (err) {
        console.error("load proposals failed", err);
        setProposals([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [contract]);

  const filteredProposals = useMemo(() => {
    let filtered = proposals;

    // 按状态筛选
    if (filter !== 'all') {
      filtered = filtered.filter(proposal => {
        switch (filter) {
          case 'active':
            return proposal.status === 1;
          case 'ended':
            return proposal.status >= 2;
          case 'pending':
            return proposal.status === 0;
          default:
            return true;
        }
      });
    }

    // 按搜索词筛选
    if (searchTerm) {
      filtered = filtered.filter(proposal =>
        proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [proposals, filter, searchTerm]);

  const getStatusInfo = (status: number) => {
    switch (status) {
      case 0:
        return { 
          text: '即将开始', 
          className: 'stellar-badge-pending', 
          icon: <FaClock className="mr-1" />,
          gradient: 'from-amber-500 to-orange-500'
        };
      case 1:
        return { 
          text: '进行中', 
          className: 'stellar-badge-active', 
          icon: <FaFire className="mr-1" />,
          gradient: 'from-emerald-500 to-teal-500'
        };
      case 2:
        return { 
          text: '已结束', 
          className: 'stellar-badge-ended', 
          icon: <FaCheckCircle className="mr-1" />,
          gradient: 'from-gray-500 to-gray-600'
        };
      case 3:
        return { 
          text: '已公布', 
          className: 'stellar-badge-published', 
          icon: <FaEye className="mr-1" />,
          gradient: 'from-blue-500 to-cyan-500'
        };
      default:
        return { 
          text: '未知', 
          className: 'text-gray-400', 
          icon: null,
          gradient: 'from-gray-400 to-gray-500'
        };
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="stellar-page-header">
          <h1 className="stellar-page-title">提案广场</h1>
          <p className="stellar-page-subtitle">浏览和参与各种投票提案</p>
        </div>
        
        <div className="cosmic-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="stellar-card stellar-loading">
              <div className="h-4 bg-gray-200 rounded mb-4 shimmer"></div>
              <div className="h-3 bg-gray-200 rounded mb-2 shimmer"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 shimmer"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 页面头部 */}
      <motion.div 
        className="stellar-page-header flex items-center justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <h1 className="stellar-page-title">提案广场</h1>
          <p className="stellar-page-subtitle">发现并参与感兴趣的投票提案</p>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link href="/create" className="cosmic-button-primary">
            <FaPlus className="mr-2" />
            创建提案
          </Link>
        </motion.div>
      </motion.div>

      {/* 统计信息 */}
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {[
          { label: "总提案", value: proposals.length, icon: "🗳️", gradient: "from-purple-500 to-pink-500" },
          { label: "进行中", value: proposals.filter(p => p.status === 1).length, icon: "⚡", gradient: "from-emerald-500 to-teal-500" },
          { label: "即将开始", value: proposals.filter(p => p.status === 0).length, icon: "⏳", gradient: "from-amber-500 to-orange-500" },
          { label: "已结束", value: proposals.filter(p => p.status >= 2).length, icon: "✅", gradient: "from-gray-500 to-gray-600" }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            className="stellar-card text-center py-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
          >
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className={`text-2xl font-bold mb-1 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
              {stat.value}
            </div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* 筛选和搜索 */}
      <motion.div 
        className="stellar-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="flex flex-col sm:flex-row gap-4">
          {/* 搜索框 */}
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索提案标题或描述..."
                className="stellar-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* 状态筛选 */}
          <div className="flex space-x-2">
            {[
              { key: 'all', label: '全部', icon: '🌟' },
              { key: 'active', label: '进行中', icon: '⚡' },
              { key: 'pending', label: '即将开始', icon: '⏳' },
              { key: 'ended', label: '已结束', icon: '✅' }
            ].map(({ key, label, icon }) => (
              <motion.button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === key
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="mr-1">{icon}</span>
                {label}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 提案列表 */}
      {filteredProposals.length === 0 ? (
        <motion.div 
          className="stellar-card text-center py-16"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="text-6xl mb-4">🌌</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {searchTerm || filter !== 'all' ? '未找到匹配的提案' : '暂无提案'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filter !== 'all' 
              ? '尝试调整筛选条件或搜索关键词'
              : '成为第一个创建提案的用户'
            }
          </p>
          {(!searchTerm && filter === 'all') && (
            <Link href="/create" className="cosmic-button-primary">
              <FaPlus className="mr-2" />
              创建第一个提案
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="cosmic-grid">
          {filteredProposals.map((proposal, index) => {
            const statusInfo = getStatusInfo(proposal.status);
            return (
              <motion.div
                key={proposal.id}
                className="stellar-card-hover group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${statusInfo.gradient} text-white`}>
                    {statusInfo.icon}
                    {statusInfo.text}
                  </div>
                  <div className="text-xs text-gray-500">
                    #{proposal.id}
                  </div>
                </div>

                <Link href={`/proposals/detail?id=${proposal.id}`} className="block">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 group-hover:text-purple-600 transition-colors line-clamp-2">
                    {proposal.title}
                  </h3>
                  {proposal.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {proposal.description}
                    </p>
                  )}
                </Link>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center">
                      <span className="mr-1">📝</span>
                      选项数: {proposal.choices.length}
                    </span>
                    <span className="flex items-center">
                      <span className="mr-1">👤</span>
                      {formatAddress(proposal.creator)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center">
                      <FaClock className="mr-1" />
                      开始: {formatDate(proposal.startTimestamp)}
                    </span>
                    <span className="flex items-center">
                      <FaClock className="mr-1" />
                      结束: {formatDate(proposal.endTimestamp)}
                    </span>
                  </div>

                  <div className="cosmic-divider"></div>

                  <div className="flex items-center justify-between">
                    <Link
                      href={`/proposals/detail?id=${proposal.id}`}
                      className="cosmic-button-outline text-sm px-4 py-2"
                    >
                      查看详情
                    </Link>
                    {proposal.status >= 2 && (
                      <Link
                        href={`/results?id=${proposal.id}`}
                        className="cosmic-button-secondary text-sm px-4 py-2"
                      >
                        查看结果
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
