"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaRocket, FaShieldAlt, FaBolt, FaGlobe, FaChartLine, FaUsers } from "react-icons/fa";

export default function HomePage() {
  const [stats, setStats] = useState({
    totalProposals: 0,
    activeProposals: 0,
    totalVotes: 0,
    isLoading: true
  });

  useEffect(() => {
    // 模拟加载统计数据
    const timer = setTimeout(() => {
      setStats({
        totalProposals: 28,
        activeProposals: 7,
        totalVotes: 1543,
        isLoading: false
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: <FaShieldAlt className="text-3xl" />,
      title: "量子级安全",
      description: "采用FHEVM同态加密技术，您的投票选择在整个过程中都保持绝对私密",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <FaBolt className="text-3xl" />,
      title: "闪电计票",
      description: "智能合约自动聚合加密投票，实时更新结果，无需人工干预",
      gradient: "from-yellow-400 to-orange-500"
    },
    {
      icon: <FaGlobe className="text-3xl" />,
      title: "星际网络",
      description: "部署在去中心化网络上，永不下线，抗审查且全球可访问",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: <FaChartLine className="text-3xl" />,
      title: "透明可验证",
      description: "所有投票过程链上记录，结果公开透明，确保选举公正性",
      gradient: "from-emerald-500 to-teal-500"
    }
  ];

  const quickActions = [
    {
      title: "发起提案",
      description: "创建新的投票议题",
      href: "/create",
      icon: <FaRocket className="text-2xl" />,
      gradient: "from-purple-500 to-pink-500",
      delay: 0.1
    },
    {
      title: "参与投票",
      description: "浏览并参与热门议题",
      href: "/proposals",
      icon: <FaUsers className="text-2xl" />,
      gradient: "from-blue-500 to-cyan-500",
      delay: 0.2
    },
    {
      title: "数据分析",
      description: "深度分析投票趋势",
      href: "/analytics",
      icon: <FaChartLine className="text-2xl" />,
      gradient: "from-emerald-500 to-teal-500",
      delay: 0.3
    }
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <motion.div 
        className="stellar-page-header"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="relative">
          <motion.h1 
            className="text-6xl md:text-7xl font-extrabold mb-6"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 bg-clip-text text-transparent">
              Stellar
            </span>
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              Vote
            </span>
          </motion.h1>
          
          <motion.div
            className="absolute -top-4 -right-4 text-4xl animate-bounce"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            ⭐
          </motion.div>
        </div>

        <motion.p 
          className="text-xl md:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          星际时代的私密投票平台
        </motion.p>
        
        <motion.p 
          className="text-gray-500 max-w-2xl mx-auto mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          利用前沿的同态加密技术，在浩瀚的区块链宇宙中构建最安全、最透明的投票生态系统
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Link href="/create" className="cosmic-button-primary px-8 py-4 text-lg cosmic-shine">
            🚀 立即发起提案
          </Link>
          <Link href="/proposals" className="cosmic-button-outline px-8 py-4 text-lg">
            🌟 探索议题宇宙
          </Link>
        </motion.div>
      </motion.div>

      {/* Stats Section */}
      <motion.div 
        className="cosmic-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        {[
          { label: "总提案数", value: stats.totalProposals, icon: "🗳️", gradient: "from-purple-500 to-pink-500" },
          { label: "进行中", value: stats.activeProposals, icon: "⚡", gradient: "from-blue-500 to-cyan-500" },
          { label: "总投票数", value: stats.totalVotes.toLocaleString(), icon: "👥", gradient: "from-emerald-500 to-teal-500" }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            className="stellar-card text-center stellar-glow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
          >
            <div className="text-4xl mb-3">{stat.icon}</div>
            <div className={`text-3xl font-bold mb-2 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
              {stats.isLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 mx-auto rounded"></div>
              ) : (
                stat.value
              )}
            </div>
            <div className="text-gray-600 font-medium">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold cosmic-gradient-text mb-3">快速启航</h2>
          <p className="text-gray-600">选择您的星际之旅</p>
        </div>
        
        <div className="cosmic-grid">
          {quickActions.map((action, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 + action.delay }}
            >
              <Link href={action.href} className="block group">
                <div className="stellar-card-hover h-full text-center p-8 cosmic-shine">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${action.gradient} text-white mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    {action.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {action.description}
                  </p>
                  <div className={`inline-flex items-center text-transparent bg-gradient-to-r ${action.gradient} bg-clip-text font-semibold group-hover:scale-105 transition-transform`}>
                    <span className="mr-2">开始探索</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div 
        className="space-y-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        <div className="text-center">
          <h2 className="text-4xl font-bold cosmic-gradient-text mb-4">核心科技</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            StellarVote 融合了最前沿的区块链技术和密码学创新，为您提供前所未有的投票体验
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="stellar-card stellar-glow group hover:scale-105 transition-all duration-300"
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1 + index * 0.15 }}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-4 rounded-2xl bg-gradient-to-r ${feature.gradient} text-white group-hover:scale-110 transition-transform duration-200`}>
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Technology Section */}
      <motion.div 
        className="stellar-card text-center stellar-glow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
      >
        <h3 className="text-2xl font-bold cosmic-gradient-text mb-6">技术星图</h3>
        <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
          {[
            { name: "FHEVM", color: "from-purple-500 to-pink-500" },
            { name: "Ethereum", color: "from-blue-500 to-cyan-500" },
            { name: "Sepolia", color: "from-emerald-500 to-teal-500" },
            { name: "Next.js", color: "from-orange-500 to-red-500" },
            { name: "TypeScript", color: "from-indigo-500 to-purple-500" }
          ].map((tech, index) => (
            <motion.div
              key={tech.name}
              className={`px-4 py-2 rounded-full bg-gradient-to-r ${tech.color} text-white text-sm font-semibold shadow-md hover:scale-105 transition-transform cursor-pointer`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 1.4 + index * 0.1 }}
            >
              {tech.name}
            </motion.div>
          ))}
        </div>
        <div className="text-gray-500 text-sm">
          <p>🌌 在星际网络中构建，为未来而生</p>
        </div>
      </motion.div>
    </div>
  );
}
