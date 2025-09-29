import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying StellarVoteCore contract...");
  console.log("Deployer address:", deployer);

  const deployment = await deploy("StellarVoteCore", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });

  console.log("StellarVoteCore deployed to:", deployment.address);
  console.log("Transaction hash:", deployment.transactionHash);

  // 验证合约（如果在测试网上）
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await new Promise(resolve => setTimeout(resolve, 30000)); // 等待30秒
    
    try {
      await hre.run("verify:verify", {
        address: deployment.address,
        constructorArguments: [],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.log("Verification failed:", error);
    }
  }
};

func.tags = ["StellarVoteCore"];
export default func;
