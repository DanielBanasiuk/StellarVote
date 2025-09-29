# StellarVote - 星际投票系统

基于FHEVM的私密投票智能合约系统。

## 环境变量设置

在项目根目录创建 `.env` 文件：

```
PRIVATE_KEY=fdb0b3c5e223fd6a138bb0fc5e9c5182d4fc28274e31cdfa5bc6298a41190116
ETHERSCAN_API_KEY=QB3VMXRZRJ3WVAJ5ASH9823B9VHFBCVV3Y
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

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
