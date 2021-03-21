const BN = require("bn.js");
const truffleContract = require("@truffle/contract");

const { time, expectRevert } = require("@openzeppelin/test-helpers");
const config = require("../../config.json");
const DaiLpPoolV2 = artifacts.require("DaiLpPoolV2");
const Debase = artifacts.require("Debase");

const IERC20 = artifacts.require("IERC20");
const UniswapV2FactoryJson = require("@uniswap/v2-core/build/UniswapV2Factory");
const UniswapV2Router02Json = require("@uniswap/v2-periphery/build/UniswapV2Router02");
const UniswapV2PairJson = require("@uniswap/v2-core/build/UniswapV2Pair");

const UniswapV2Factory = truffleContract(UniswapV2FactoryJson);
const UniswapV2Router02 = truffleContract(UniswapV2Router02Json);
const UniswapV2Pair = truffleContract(UniswapV2PairJson);

UniswapV2Factory.setProvider(web3._provider);
UniswapV2Router02.setProvider(web3._provider);
UniswapV2Pair.setProvider(web3._provider);

const decimals = new BN("18");

contract("DaiLpPoolV2 Mainnet testing", (accounts) => {
  let treasury = accounts[9];
  let policy = accounts[0];
  let daiLpPool;
  let dai;
  let debase;
  let mph;
  let uniFactory;
  let uniRouter02;
  let daiDebaseLp;
  let lpSupply;

  let depositAmounts = [new BN("100").mul(new BN("10").pow(decimals))];
  before("Get contract references", async () => {
    dai = await IERC20.at(config.dai);
    mph = await IERC20.at(config.mph);
    debase = await Debase.new();
    uniFactory = await UniswapV2Factory.at(config.uniFactory);
    uniRouter02 = await UniswapV2Router02.new(config.uniFactory, config.weth, {
      from: accounts[0],
    });
    await uniRouter02.swapExactETHForTokens(
      0,
      [config.weth, config.dai],
      accounts[0],
      7777777777,
      { from: accounts[0], value: "100000000000000000000" }
    );
    await debase.approve(uniRouter02.address, "800000000000000000000", {
      from: accounts[0],
    });
    await dai.approve(uniRouter02.address, "1000000000000000000000", {
      from: accounts[0],
    });
    await uniRouter02.addLiquidity(
      debase.address,
      dai.address,
      "800000000000000000000",
      "1000000000000000000000",
      0,
      0,
      accounts[0],
      7777777777,
      { from: accounts[0] }
    );

    const lpAddress = await uniFactory.getPair(dai.address, debase.address);
    daiDebaseLp = await IERC20.at(lpAddress);
    lpSupply = new BN((await daiDebaseLp.totalSupply()).toString());
    daiLpPool = await DaiLpPoolV2.new(
      daiDebaseLp.address,
      dai.address,
      debase.address,
      config.mph,
      policy,
      config.daiFixedPool,
      config.mphVesting,
      config.lockPeriod,
      treasury,
      config.debaseRewardPercentage,
      config.blockDuration
    );
    await daiLpPool.setPoolEnabled(true, { from: policy });
  });

  it("Check deposit", async () => {
    await daiDebaseLp.transfer(accounts[1], depositAmounts[0], {
      from: accounts[0],
    });
    await daiDebaseLp.approve(daiLpPool.address, depositAmounts[0], {
      from: accounts[1],
    });
    await daiLpPool.deposit(depositAmounts[0], { from: accounts[1] });
    assert.equal(
      (await daiDebaseLp.totalSupply()).toString(),
      lpSupply.sub(depositAmounts[0]).toString()
    );
    assert.equal(
      (await daiLpPool.lpDeposits(accounts[1])).toString(),
      depositAmounts[0].toString()
    );
    assert.equal(
      (await daiLpPool.totalLpLocked()).toString(),
      depositAmounts[0].toString()
    );

    await time.increase(config.vestingPeriod);
    const mphUserOldBalance = new BN(
      (await mph.balanceOf(accounts[1])).toString()
    );
    const mphTreasureOldBalance = new BN(
      (await mph.balanceOf(treasury)).toString()
    );

    await daiLpPool.withdraw(0, 0, { from: accounts[1] });
    const mphUserBalance = new BN(
      (await mph.balanceOf(accounts[1])).toString()
    );
    const mphPoolBalance = new BN(
      (await mph.balanceOf(daiLpPool.address)).toString()
    );
    const mphTreasureBalance = new BN(
      (await mph.balanceOf(treasury)).toString()
    );
    const deposit = await daiLpPool.deposits(0);
    const mphReward = new BN(deposit["mphReward"].toString());
    assert.equal(
      mphUserBalance
        .sub(mphUserOldBalance)
        .add(mphPoolBalance)
        .add(mphTreasureBalance)
        .sub(mphTreasureOldBalance)
        .toString(),
      mphReward.toString()
    );
    assert.equal(
      mphPoolBalance.toString(),
      mphReward
        .mul(new BN(config.mphTakingBackMultiplier))
        .div(new BN("10").pow(new BN("18")))
        .toString()
    );
    assert.equal(
      mphTreasureBalance.sub(mphTreasureOldBalance).toString(),
      mphReward
        .sub(mphPoolBalance)
        .mul(new BN(config.mphFee.toString()))
        .div(new BN("1000"))
        .toString()
    );
    await time.increase(config.lockPeriod);
    await daiLpPool.withdraw(0, 0, { from: accounts[1] });
  });
});
