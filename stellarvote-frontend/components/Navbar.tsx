"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { FaWallet, FaBars, FaTimes } from "react-icons/fa";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState("");
  const pathname = usePathname();

  const navigation = [
    { name: "首页", href: "/" },
    { name: "提案广场", href: "/proposals" },
    { name: "创建提案", href: "/create" },
    { name: "数据分析", href: "/analytics" },
    { name: "结果查询", href: "/results" },
  ];

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setIsConnected(true);
          setAddress(accounts[0]);
        }
      } catch (error) {
        console.error("检查钱包连接失败:", error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setIsConnected(true);
          setAddress(accounts[0]);
        }
      } catch (error) {
        console.error("连接钱包失败:", error);
      }
    } else {
      alert("请安装 MetaMask 钱包!");
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <motion.nav 
      className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                S
              </div>
              <span className="text-xl font-bold cosmic-gradient-text">StellarVote</span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  pathname === item.href
                    ? "text-purple-600"
                    : "text-gray-600 hover:text-purple-600"
                }`}
              >
                {item.name}
                {pathname === item.href && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"
                    layoutId="navbar-indicator"
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Wallet Connection */}
          <div className="hidden md:flex items-center space-x-4">
            {isConnected ? (
              <motion.div 
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl border border-emerald-200"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-emerald-700">
                  {formatAddress(address)}
                </span>
              </motion.div>
            ) : (
              <motion.button
                onClick={connectWallet}
                className="cosmic-button-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaWallet className="mr-2" />
                连接钱包
              </motion.button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div 
            className="md:hidden py-4 border-t border-gray-200"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    pathname === item.href
                      ? "text-purple-600 bg-purple-50"
                      : "text-gray-600 hover:text-purple-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile Wallet Connection */}
              <div className="pt-4 border-t border-gray-200">
                {isConnected ? (
                  <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg border border-emerald-200">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-emerald-700">
                      {formatAddress(address)}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={connectWallet}
                    className="w-full cosmic-button-primary justify-center"
                  >
                    <FaWallet className="mr-2" />
                    连接钱包
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}
