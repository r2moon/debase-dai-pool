const BN = require('bn.js');
const truffleContract = require('@truffle/contract');

const { expectRevert, send, balance,  time } = require('@openzeppelin/test-helpers');
const config = require('../config.json');
const DaiLpPool = artifacts.require("DaiLpPool");
const Debase = artifacts.require("Debase");

const IERC20 = artifacts.require("IERC20");
const TestERC20 = artifacts.require("TestERC20");
const Vesting = artifacts.require("Vesting");
const FakeMphMinter = artifacts.require("FakeMphMinter");
const FakeDInterest = artifacts.require("FakeDInterest");
const FakeStakingPool = artifacts.require("FakeStakingPool");

const UniswapV2FactoryJson = require("@uniswap/v2-core/build/UniswapV2Factory");
const UniswapV2Router02Json = require("@uniswap/v2-periphery/build/UniswapV2Router02");
const UniswapV2PairJson = require("@uniswap/v2-core/build/UniswapV2Pair");

const UniswapV2Factory = truffleContract(UniswapV2FactoryJson);
const UniswapV2Router02 = truffleContract(UniswapV2Router02Json);
const UniswapV2Pair = truffleContract(UniswapV2PairJson);

UniswapV2Factory.setProvider(web3._provider);
UniswapV2Router02.setProvider(web3._provider);
UniswapV2Pair.setProvider(web3._provider);

const decimals = new BN('18');

contract('DaiLpPool Mainnet testing', (accounts) => {
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

  let deposits = [
    {
      lp: (new BN('10')).mul((new BN('10')).pow(decimals))
    }    
  ]
  let stakingReward = (new BN('100000')).mul((new BN('10')).pow(decimals));

  before('Get contract references', async () => {
    dai = await TestERC20.new((new BN('10000000')).mul((new BN('10')).pow(decimals)).toString(), "Test dai", "DAI");
    debase = await Debase.new();
    mph = await TestERC20.new((new BN('10000000')).mul((new BN('10')).pow(decimals)).toString(), "Test Mph", "MPH");
    vesting = await Vesting.new(mph.address, {from: accounts[0]});
    mphMinter = await FakeMphMinter.new(mph.address, vesting.address, {from: accounts[0]});
    dInterest = await FakeDInterest.new(dai.address, mphMinter.address, {from: accounts[0]});
    mphStaking = await FakeStakingPool.new(mph.address, dai.address, {from: accounts[0]});
  
    await dai.approve(
      dInterest.address,
      (new BN('10000000')).mul((new BN('10')).pow(decimals)).toString(),
      {from: accounts[0]}
    );
    await dai.approve(
      mphStaking.address,
      (new BN('10000000')).mul((new BN('10')).pow(decimals)).toString(),
      {from: accounts[0]}
    );

    await dai.transfer(mphStaking.address, stakingReward.toString(), {from: accounts[0]});
  
    uniFactory = await UniswapV2Factory.new(treasury, {from: accounts[0]});
    uniRouter02 = await UniswapV2Router02.new(uniFactory.address, config.weth, {from: accounts[0]});

    await debase.approve(uniRouter02.address, "8000000000000000000000", {from: accounts[0]});
    await dai.approve(uniRouter02.address, "10000000000000000000000", {from: accounts[0]});
    await uniRouter02.addLiquidity(
      debase.address,
      dai.address,
      "8000000000000000000000",
      "10000000000000000000000",
      0,
      0,
      accounts[0],
      7777777777,
      {from: accounts[0]}
    );

    const lpAddress = await uniFactory.getPair(dai.address, debase.address);
    daiDebaseLp = await IERC20.at(lpAddress);
    lpSupply = new BN((await daiDebaseLp.totalSupply()).toString());
    daiLpPool = await DaiLpPool.new(
      daiDebaseLp.address,
      dai.address,
      debase.address,
      mph.address,
      policy,
      dInterest.address,
      mphStaking.address,
      vesting.address,
      config.lockPeriod,
      treasury,
      config.debaseRewardPercentage,
      config.blockDuration
    );
    await daiLpPool.setPoolEnabled(true, {from: policy});
    await daiLpPool.setMphFee(20, {from: policy});
  });

  describe('Test single deposit', () => {
    it('Deposit', async () => {
      const daiTotal = new BN((await dai.balanceOf(daiDebaseLp.address)).toString());
      const debaseTotal = new BN((await debase.balanceOf(daiDebaseLp.address)).toString());
      await daiDebaseLp.transfer(accounts[1], deposits[0].lp, {from: accounts[0]});
      await daiDebaseLp.approve(daiLpPool.address, deposits[0].lp, {from: accounts[1]});
      await daiLpPool.deposit(deposits[0].lp, {from: accounts[1]});
      assert.equal((await daiDebaseLp.totalSupply()).toString(), (lpSupply.sub(deposits[0].lp)).toString());
      assert.equal((await daiLpPool.lpDeposits(accounts[1])).toString(), deposits[0].lp.toString());    
      assert.equal((await daiLpPool.totalLpLocked()).toString(), deposits[0].lp.toString());
      deposits[0].dai = daiTotal.sub(new BN((await dai.balanceOf(daiDebaseLp.address)).toString()));
      deposits[0].debase = debaseTotal.sub(new BN((await debase.balanceOf(daiDebaseLp.address)).toString()));
      assert.equal((await dai.balanceOf(dInterest.address)).toString(), deposits[0].dai.toString());
      assert.equal((await dai.balanceOf(daiLpPool.address)).toString(), 0);
  
      let depositInfo = await daiLpPool.deposits(0);
      assert.equal(depositInfo.owner, accounts[1]);
      assert.equal(depositInfo.amount.toString(), deposits[0].lp.toString());
      assert.equal(depositInfo.daiAmount.toString(), deposits[0].dai.toString());
      // assert.equal(depositInfo.daiAmount, deposits[0].debase);
      assert.equal(depositInfo.daiDepositId, 1);
      assert.equal(depositInfo.mphReward.toString(), "0");
      // assert.equal(depositInfo.mphReward.toString(), deposits[0].dai.div(new BN('2')).toString());
      assert.equal(depositInfo.mphVestingIdx, 0);
      assert.equal(depositInfo.withdrawed, false);

      const mphReward = deposits[0].dai.div(new BN('2'));
      assert.equal((await mph.balanceOf(vesting.address)).toString(), mphReward.toString());

      deposits[0].daiInterest = (new BN('100')).mul((new BN('10')).pow(decimals));
      deposits[0].daiStakingReward = (new BN('50')).mul((new BN('10')).pow(decimals));
      await dInterest.setNextInterest(deposits[0].daiInterest);
      await mphStaking.setNextReward(deposits[0].daiStakingReward);

      await time.increase(config.lockPeriod);
      await daiLpPool.withdraw(0, 0, {from: accounts[1]});

      deposits[0].daiStakingReward = deposits[0].daiStakingReward
        .mul(new BN('1000000000000'))
        .div(mphReward)
        .mul(mphReward)
        .div(new BN('1000000000000'))
      depositInfo = await daiLpPool.deposits(0);
      assert.equal(depositInfo.owner, accounts[1]);
      assert.equal(depositInfo.amount.toString(), deposits[0].lp.toString());
      assert.equal(depositInfo.daiAmount.toString(), deposits[0].dai.toString());
      assert.equal(depositInfo.daiDepositId, 1);
      assert.equal(depositInfo.mphReward.toString(), mphReward.toString());
      assert.equal(depositInfo.mphVestingIdx, 0);
      assert.equal(depositInfo.withdrawed, true);

      const mphRewardRemain = mphReward.sub(mphReward.mul(new BN('30')).div(new BN('100')));
      const mphFee = mphRewardRemain.mul(new BN('2')).div(new BN('100'));

      const mphBal1 = new BN((await mph.balanceOf(accounts[1])).toString());
      const mphBal2 = new BN((await mph.balanceOf(treasury)).toString());

      assert.equal(mphBal2.toString(), mphFee.toString());
      assert.equal((mphBal1.add(mphBal2)).toString(), mphRewardRemain.toString());

      assert.equal((await mph.balanceOf(accounts[1])).toString(), mphRewardRemain.sub(mphFee).toString());
      assert.equal((await mph.balanceOf(treasury)).toString(), mphFee.toString());

      const daiFee = deposits[0].daiInterest.add(deposits[0].daiStakingReward).mul(new BN('3')).div(new BN('100'));
      assert.equal(
        (await dai.balanceOf(accounts[1])).toString(),
        deposits[0].dai.add(deposits[0].daiInterest).add(deposits[0].daiStakingReward).sub(daiFee).toString());
      assert.equal(
        (await dai.balanceOf(treasury)).toString(), daiFee.toString());
    });
  });
});
