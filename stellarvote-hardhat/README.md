# StellarVote - 星际投票系统

基于FHEVM的私密投票智能合约系统。

## 环境变量设置

在项目根目录创建 `.env` 文件：

```
PRIVATE_KEY=your_private_key_here # 切勿提交到版本库
ETHERSCAN_API_KEY=your_etherscan_api_key_here
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

> 注意：请不要将任何私钥或机密信息提交到仓库。

## 安装依赖

```bash
npm install
```

## 编译合约

```bash
npm run compile
```

## 部署到Sepolia测试网

```bash
npm run deploy
```

## 部署到本地网络

```bash
npm run deploy:local
```
