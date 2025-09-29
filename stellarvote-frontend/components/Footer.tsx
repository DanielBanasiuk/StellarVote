"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FaGithub, FaTwitter, FaDiscord, FaTelegram, FaHeart } from "react-icons/fa";

export function Footer() {
  const links = [
    {
      title: "产品",
      items: [
        { name: "提案广场", href: "/proposals" },
        { name: "创建提案", href: "/create" },
        { name: "数据分析", href: "/analytics" },
        { name: "结果查询", href: "/results" },
      ]
    },
    {
      title: "资源",
      items: [
        { name: "技术文档", href: "#" },
        { name: "API 文档", href: "#" },
        { name: "开发指南", href: "#" },
        { name: "常见问题", href: "#" },
      ]
    },
    {
      title: "社区",
      items: [
        { name: "GitHub", href: "#" },
        { name: "Discord", href: "#" },
        { name: "Twitter", href: "#" },
        { name: "Telegram", href: "#" },
      ]
    }
  ];

  const socialLinks = [
    { icon: <FaGithub />, href: "#", label: "GitHub" },
    { icon: <FaTwitter />, href: "#", label: "Twitter" },
    { icon: <FaDiscord />, href: "#", label: "Discord" },
    { icon: <FaTelegram />, href: "#", label: "Telegram" },
  ];

  return (
    <footer className="bg-white/60 backdrop-blur-sm border-t border-gray-200/50 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">
                S
              </div>
              <span className="text-lg font-bold cosmic-gradient-text">StellarVote</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              基于FHEVM的下一代私密投票平台，在保护隐私的同时实现透明可信的投票体验。
            </p>
            <div className="flex space-x-3">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:from-purple-500 hover:to-pink-500 hover:text-white transition-all duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Links Sections */}
          {links.map((section, sectionIndex) => (
            <motion.div 
              key={section.title}
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * (sectionIndex + 1) }}
            >
              <h3 className="font-semibold text-gray-800">{section.title}</h3>
              <ul className="space-y-2">
                {section.items.map((item, index) => (
                  <motion.li 
                    key={item.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      className="text-sm text-gray-600 hover:text-purple-600 transition-colors duration-200"
                    >
                      {item.name}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="cosmic-divider"></div>

        {/* Bottom Section */}
        <motion.div 
          className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="text-sm text-gray-500">
            © 2024 StellarVote. 保留所有权利.
          </div>
          
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <span>Made with</span>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
            >
              <FaHeart className="text-red-500" />
            </motion.div>
            <span>for the future of voting</span>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <Link href="#" className="hover:text-purple-600 transition-colors">
              隐私政策
            </Link>
            <span>•</span>
            <Link href="#" className="hover:text-purple-600 transition-colors">
              服务条款
            </Link>
          </div>
        </motion.div>

        {/* Tech Badge */}
        <motion.div 
          className="text-center pt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full border border-purple-200">
            <span className="text-xs font-medium text-purple-700">Powered by FHEVM</span>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
