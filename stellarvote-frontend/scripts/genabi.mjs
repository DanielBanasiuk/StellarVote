import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HARDHAT_DIR = path.resolve(__dirname, '../../stellarvote-hardhat');
const ABI_DIR = path.resolve(__dirname, '../abi');

// 确保ABI目录存在
if (!fs.existsSync(ABI_DIR)) {
  fs.mkdirSync(ABI_DIR, { recursive: true });
}

// 生成ABI文件
function generateABI() {
  try {
    // 读取编译后的合约artifacts
    const artifactPath = path.join(HARDHAT_DIR, 'artifacts/contracts/StellarVoteCore.sol/StellarVoteCore.json');
    
    if (!fs.existsSync(artifactPath)) {
      console.log('⚠️  合约artifact不存在，请先编译合约');
      console.log('   cd stellarvote-hardhat && npm run compile');
      return;
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    
    // 生成ABI TypeScript文件
    const abiContent = `// 自动生成的ABI文件，请勿手动修改
export const StellarVoteCoreABI = ${JSON.stringify(artifact, null, 2)} as const;
`;
    
    fs.writeFileSync(path.join(ABI_DIR, 'StellarVoteCoreABI.ts'), abiContent);
    
    // 生成地址配置文件
    const addressContent = `// 合约地址配置文件
export const StellarVoteCoreAddresses = {
  // Sepolia测试网
  "11155111": {
    address: "0x", // 部署后填入实际地址
    blockNumber: 0
  },
  // 本地开发网络
  "31337": {
    address: "0x", // 本地部署地址
    blockNumber: 0
  }
} as const;

export type SupportedChainId = keyof typeof StellarVoteCoreAddresses;
`;
    
    fs.writeFileSync(path.join(ABI_DIR, 'StellarVoteCoreAddresses.ts'), addressContent);
    
    console.log('✅ ABI文件生成成功!');
    console.log('   - StellarVoteCoreABI.ts');
    console.log('   - StellarVoteCoreAddresses.ts');
    
  } catch (error) {
    console.error('❌ 生成ABI文件失败:', error.message);
  }
}

// 读取部署信息并更新地址配置
function updateAddresses() {
  try {
    const deploymentDir = path.join(HARDHAT_DIR, 'deployments');
    
    if (!fs.existsSync(deploymentDir)) {
      console.log('⚠️  部署信息不存在');
      return;
    }
    
    const networks = fs.readdirSync(deploymentDir);
    const addresses = {};
    
    for (const network of networks) {
      const networkPath = path.join(deploymentDir, network);
      if (fs.statSync(networkPath).isDirectory()) {
        const contractFile = path.join(networkPath, 'StellarVoteCore.json');
        if (fs.existsSync(contractFile)) {
          const deployment = JSON.parse(fs.readFileSync(contractFile, 'utf8'));
          
          // 网络ID映射
          const chainIds = {
            'localhost': '31337',
            'sepolia': '11155111'
          };
          
          const chainId = chainIds[network];
          if (chainId) {
            addresses[chainId] = {
              address: deployment.address,
              blockNumber: deployment.receipt?.blockNumber || 0
            };
          }
        }
      }
    }
    
    if (Object.keys(addresses).length > 0) {
      const addressContent = `// 合约地址配置文件 - 自动更新
export const StellarVoteCoreAddresses = ${JSON.stringify(addresses, null, 2)} as const;

export type SupportedChainId = keyof typeof StellarVoteCoreAddresses;
`;
      
      fs.writeFileSync(path.join(ABI_DIR, 'StellarVoteCoreAddresses.ts'), addressContent);
      console.log('✅ 合约地址更新成功!');
      console.log('更新的网络:', Object.keys(addresses));
    }
    
  } catch (error) {
    console.error('❌ 更新地址失败:', error.message);
  }
}

// 主执行函数
function main() {
  console.log('🚀 生成StellarVote ABI文件...\n');
  
  generateABI();
  updateAddresses();
  
  console.log('\n✨ 完成! 现在可以启动前端开发服务器了');
}

main();
