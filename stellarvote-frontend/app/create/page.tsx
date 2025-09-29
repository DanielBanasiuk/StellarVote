"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ethers } from "ethers";
import { FaPlus, FaTrash, FaCheck, FaClock, FaRocket } from "react-icons/fa";
import { StellarVoteCoreABI } from "@/abi/StellarVoteCoreABI";
import { StellarVoteCoreAddresses } from "@/abi/StellarVoteCoreAddresses";

interface ProposalFormData {
  title: string;
  description: string;
  choices: string[];
  startTime: number | null;
  endTime: number | null;
}

export default function CreateProposalPage() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [chainId, setChainId] = useState<number | undefined>();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<ProposalFormData>({
    title: "",
    description: "",
    choices: ["", ""],
    startTime: null,
    endTime: null
  });

  const contract = useMemo(() => {
    if (!provider || !chainId || !signer) return null;
    const info = (StellarVoteCoreAddresses as any)[String(chainId)];
    const addr: string | undefined = info?.address;
    const isValid = typeof addr === "string" && /^0x[a-fA-F0-9]{40}$/.test(addr);
    if (!isValid) return null;
    return new ethers.Contract(addr, (StellarVoteCoreABI as any).abi, signer);
  }, [provider, chainId, signer]);

  useEffect(() => {
    (async () => {
      if (!window?.ethereum) return;
      const bp = new ethers.BrowserProvider(window.ethereum);
      setProvider(bp);
      const net = await bp.getNetwork();
      setChainId(Number(net.chainId));
      try {
        setSigner(await bp.getSigner());
      } catch {}

      // 设置默认时间
      const now = Math.floor(Date.now() / 1000);
      setFormData(prev => ({
        ...prev,
        startTime: now + 300, // 5分钟后开始
        endTime: now + 86400  // 24小时后结束
      }));
    })();
  }, []);

  const steps = [
    { 
      number: 1, 
      title: "基本信息", 
      description: "设置提案标题和描述",
      icon: <FaRocket className="text-lg" />
    },
    { 
      number: 2, 
      title: "投票选项", 
      description: "添加投票选项",
      icon: <FaPlus className="text-lg" />
    },
    { 
      number: 3, 
      title: "时间设置", 
      description: "设置投票时间窗口",
      icon: <FaClock className="text-lg" />
    },
    { 
      number: 4, 
      title: "确认发布", 
      description: "检查并提交提案",
      icon: <FaCheck className="text-lg" />
    }
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          newErrors.title = "请输入提案标题";
        }
        break;
      case 2:
        if (formData.choices.length < 2) {
          newErrors.choices = "至少需要2个选项";
        }
        if (formData.choices.some(choice => !choice.trim())) {
          newErrors.choices = "所有选项都不能为空";
        }
        break;
      case 3:
        if (!formData.startTime || !formData.endTime) {
          newErrors.time = "请设置开始和结束时间";
        } else if (formData.endTime <= formData.startTime) {
          newErrors.time = "结束时间必须晚于开始时间";
        } else if (formData.startTime <= Math.floor(Date.now() / 1000)) {
          newErrors.time = "开始时间必须晚于当前时间";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const addChoice = () => {
    if (formData.choices.length < 10) {
      setFormData(prev => ({
        ...prev,
        choices: [...prev.choices, ""]
      }));
    }
  };

  const removeChoice = (index: number) => {
    if (formData.choices.length > 2) {
      setFormData(prev => ({
        ...prev,
        choices: prev.choices.filter((_, i) => i !== index)
      }));
    }
  };

  const updateChoice = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      choices: prev.choices.map((choice, i) => i === index ? value : choice)
    }));
  };

  const formatDateForInput = (timestamp: number | null): string => {
    if (!timestamp) return "";
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const parseInputDate = (value: string): number => {
    const date = new Date(value);
    return Math.floor(date.getTime() / 1000);
  };

  const submitProposal = useCallback(async () => {
    // 基本校验与环境提示
    if (!validateStep(currentStep)) return;
    if (!provider) {
      setMessage("未检测到钱包，请先连接钱包");
      return;
    }
    if (!signer) {
      setMessage("请在钱包中授权连接后再试");
      return;
    }
    if (!contract) {
      setMessage("合约未就绪：请部署到当前网络或填写正确地址");
      return;
    }

    setIsSubmitting(true);
    setMessage("正在创建提案...");

    try {
      // 确保链为 Sepolia，尝试自动切换
      const desiredChainId = 11155111;
      if (chainId !== desiredChainId && typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          });
        } catch {}
      }

      const tx = await (contract as any).initializeProposal(
        formData.title.trim(),
        formData.description.trim(),
        formData.choices.map(choice => choice.trim()),
        BigInt(formData.startTime!),
        BigInt(formData.endTime!),
        1
      );

      setMessage("交易已提交，等待确认...");
      const receipt = await tx.wait();
      setMessage(`提案创建成功！交易哈希: ${receipt?.hash || tx?.hash || ''}`);
    } catch (error: any) {
      setMessage(`创建失败: ${error?.message || '未知错误'}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [contract, formData, currentStep]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="stellar-input-group">
              <label className="stellar-label">提案标题 *</label>
              <input
                type="text"
                className={`stellar-input ${errors.title ? 'border-red-400 focus:ring-red-500' : ''}`}
                placeholder="请输入简洁明了的提案标题"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>
            <div className="stellar-input-group">
              <label className="stellar-label">提案描述</label>
              <textarea
                className="stellar-input min-h-[120px]"
                placeholder="详细描述投票提案的背景和目的（可选）"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">投票选项</h3>
                <p className="text-gray-600 text-sm">添加用户可以选择的选项</p>
              </div>
              <motion.button
                onClick={addChoice}
                disabled={formData.choices.length >= 10}
                className="cosmic-button-outline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaPlus className="mr-2" />
                添加选项
              </motion.button>
            </div>
            
            <div className="space-y-4">
              {formData.choices.map((choice, index) => (
                <motion.div 
                  key={index} 
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-sm bg-gradient-to-r ${
                    index % 4 === 0 ? 'from-purple-500 to-pink-500' :
                    index % 4 === 1 ? 'from-blue-500 to-cyan-500' :
                    index % 4 === 2 ? 'from-emerald-500 to-teal-500' :
                    'from-orange-500 to-red-500'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <input
                    type="text"
                    className="stellar-input flex-1"
                    placeholder={`选项 ${String.fromCharCode(65 + index)}`}
                    value={choice}
                    onChange={(e) => updateChoice(index, e.target.value)}
                  />
                  {formData.choices.length > 2 && (
                    <motion.button
                      onClick={() => removeChoice(index)}
                      className="cosmic-button-danger p-3"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaTrash className="text-sm" />
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </div>
            
            {errors.choices && <p className="text-red-500 text-sm">{errors.choices}</p>}
          </motion.div>
        );

      case 3:
        return (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div className="stellar-input-group">
                <label className="stellar-label">开始时间 *</label>
                <input
                  type="datetime-local"
                  className={`stellar-input ${errors.time ? 'border-red-400 focus:ring-red-500' : ''}`}
                  value={formatDateForInput(formData.startTime)}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: parseInputDate(e.target.value) }))}
                />
              </div>
              <div className="stellar-input-group">
                <label className="stellar-label">结束时间 *</label>
                <input
                  type="datetime-local"
                  className={`stellar-input ${errors.time ? 'border-red-400 focus:ring-red-500' : ''}`}
                  value={formatDateForInput(formData.endTime)}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: parseInputDate(e.target.value) }))}
                />
              </div>
            </div>
            
            {errors.time && <p className="text-red-500 text-sm">{errors.time}</p>}
            
            <div className="stellar-card bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
              <h4 className="text-blue-700 font-semibold mb-3 flex items-center">
                <FaClock className="mr-2" />
                时间设置说明
              </h4>
              <ul className="text-sm text-blue-600 space-y-2">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                  开始时间必须晚于当前时间
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                  结束时间必须晚于开始时间
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                  建议给用户足够的投票时间
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                  时间一旦设定无法修改
                </li>
              </ul>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="stellar-card stellar-glow">
              <h3 className="text-xl font-semibold cosmic-gradient-text mb-6">提案预览</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">标题</h4>
                  <p className="text-gray-900 text-lg">{formData.title}</p>
                </div>
                {formData.description && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">描述</h4>
                    <p className="text-gray-700">{formData.description}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">选项 ({formData.choices.length})</h4>
                  <div className="space-y-3">
                    {formData.choices.map((choice, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm bg-gradient-to-r ${
                          index % 4 === 0 ? 'from-purple-500 to-pink-500' :
                          index % 4 === 1 ? 'from-blue-500 to-cyan-500' :
                          index % 4 === 2 ? 'from-emerald-500 to-teal-500' :
                          'from-orange-500 to-red-500'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="text-gray-800">{choice}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">开始时间</h4>
                    <p className="text-gray-600">
                      {formData.startTime ? new Date(formData.startTime * 1000).toLocaleString('zh-CN') : ''}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">结束时间</h4>
                    <p className="text-gray-600">
                      {formData.endTime ? new Date(formData.endTime * 1000).toLocaleString('zh-CN') : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {message && (
              <motion.div 
                className={`stellar-card text-center ${
                  message.includes('成功') ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200' : 
                  message.includes('失败') ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200' : 
                  'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'
                }`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <p className={`font-medium ${
                  message.includes('成功') ? 'text-emerald-700' : 
                  message.includes('失败') ? 'text-red-700' : 
                  'text-blue-700'
                }`}>
                  {message}
                </p>
              </motion.div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 页面头部 */}
      <motion.div 
        className="stellar-page-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="stellar-page-title">创建提案</h1>
        <p className="stellar-page-subtitle">通过简单的步骤创建一个新的投票提案</p>
      </motion.div>

      {/* 步骤指示器 */}
      <motion.div 
        className="stellar-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <motion.div 
                className={`flex items-center space-x-3 ${
                  currentStep >= step.number ? 'text-purple-600' : 'text-gray-400'
                }`}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-semibold transition-all duration-200 ${
                  currentStep > step.number ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' :
                  currentStep === step.number ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step.number ? (
                    <FaCheck />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="hidden sm:block">
                  <div className="font-semibold">{step.title}</div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
              </motion.div>
              {index < steps.length - 1 && (
                <div className={`hidden sm:block w-16 h-px mx-6 transition-all duration-200 ${
                  currentStep > step.number ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* 步骤内容 */}
      <motion.div 
        className="stellar-card min-h-[500px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {renderStepContent()}
      </motion.div>

      {/* 导航按钮 */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <motion.button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="cosmic-button-outline disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: currentStep === 1 ? 1 : 1.05 }}
          whileTap={{ scale: currentStep === 1 ? 1 : 0.95 }}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          上一步
        </motion.button>

        {currentStep < 4 ? (
          <motion.button 
            onClick={nextStep} 
            className="cosmic-button-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            下一步
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        ) : (
          <motion.button
            onClick={submitProposal}
            disabled={isSubmitting || !contract}
            className="cosmic-button-success disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
          >
            {isSubmitting ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                创建中...
              </>
            ) : (
              <>
                <FaRocket className="mr-2" />
                {contract ? '发布提案' : '合约未就绪'}
              </>
            )}
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
