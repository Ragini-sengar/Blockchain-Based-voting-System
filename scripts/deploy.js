import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);

  const Voting = await hre.ethers.getContractFactory("Voting");

  const candidates = ["Alice", "Bob", "Charlie"];

  const voting = await Voting.deploy(candidates);

  await voting.waitForDeployment();

  console.log("Voting contract deployed to:", await voting.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});