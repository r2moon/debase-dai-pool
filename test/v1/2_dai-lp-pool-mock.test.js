const BN = require('bn.js');
const truffleContract = require('@truffle/contract');

const { expectRevert, send, balance,  time } = require('@openzeppelin/test-helpers');
const config = require('../../config.json');
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

contract('DaiLpPool Mock testing', (accounts) => {
  let treasury = accounts[9];
  let policy = accounts[0];
  let daiLpPool;
  let dInterest;
  let mphStaking;
  let vesting;
  let dai;
  let debase;
  let mph;
  let uniFactory;
  let uniRouter02;
  let daiDebaseLp;
  let lpSupply;

  let lastDepositId = 0;

  const resetBalance = async () => {
    for (let i = 1; i < 10; i += 1) {
      const daiBal = (await dai.balanceOf(accounts[i])).toString();
      await dai.transfer(policy, daiBal, {from: accounts[i]});
      const debaseBal = (await debase.balanceOf(accounts[i])).toString();
      await debase.transfer(policy, debaseBal, {from: accounts[i]});
      const lpBal = (await daiDebaseLp.balanceOf(accounts[i])).toString();
      await daiDebaseLp.transfer(policy, lpBal, {from: accounts[i]});
    }
  };

  const getGonsPerFragments = async () => {
    const MAX_UINT256 = new BN('2').pow(new BN('256')).sub(new BN('1'));
    const INITIAL_FRAGMENTS_SUPPLY = (new BN('1000000')).mul((new BN('10')).pow(decimals));
    const TOTAL_GONS = MAX_UINT256.sub(MAX_UINT256.mod(INITIAL_FRAGMENTS_SUPPLY));
    const totalSupply = new BN((await debase.totalSupply()).toString());
    return TOTAL_GONS.div(totalSupply);
  }

  before('Get contract references', async () => {
    dai = await TestERC20.new((new BN('10000000')).mul((new BN('10')).pow(decimals)).toString(), "Test dai", "DAI");
    debase = await Debase.new();
    mph = await TestERC20.new((new BN('10000000')).mul((new BN('10')).pow(decimals)).toString(), "Test Mph", "MPH");
    vesting = await Vesting.new(mph.address, {from: accounts[0]});
    const mphMinter = await FakeMphMinter.new(mph.address, vesting.address, {from: accounts[0]});
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
    await daiLpPool.setMphFee(200, {from: policy});
  });

  describe('Test limitations', async () => {
    let deposit = (new BN('10')).mul((new BN('10')).pow(decimals));
    before('Send lp to account', async() => {
      await daiDebaseLp.transfer(accounts[8], deposit, {from: accounts[0]});
      await daiDebaseLp.approve(daiLpPool.address, deposit, {from: accounts[8]});
    });

    it('enable/disable pools', async () => {
      await daiLpPool.setPoolEnabled(false);
      await expectRevert(
        daiLpPool.deposit(deposit, {from: accounts[8]}),
        "Pool isn't enabled"
      );
      await daiLpPool.setPoolEnabled(true);
      await daiLpPool.deposit(deposit, {from: accounts[8]});
      assert.equal((await daiLpPool.userDepositLength(accounts[8])), 1);
      assert.equal((await daiLpPool.depositIds(accounts[8], 0)), 0);
      lastDepositId += 1;
      await time.increase(config.lockPeriod);
      await daiLpPool.withdraw(0, 0, {from: accounts[8]});
    });

    it('enable/disable total lp limit', async () => {
      await daiLpPool.setTotalLpLimitEnabled(true);
      await daiLpPool.setTotalLpLimit((new BN('9')).mul((new BN('10')).pow(decimals)));
      await expectRevert(
        daiLpPool.deposit(deposit, {from: accounts[8]}),
        "To much lp locked"
      );
      await daiLpPool.setTotalLpLimitEnabled(false);
    });
    it('enable/disable total lp limit', async () => {
      await daiLpPool.setMaxDepositLimitEnabled(true);
      await daiLpPool.setMaxDepositLimit((new BN('9')).mul((new BN('10')).pow(decimals)));
      await expectRevert(
        daiLpPool.deposit(deposit, {from: accounts[8]}),
        "to much deposit for this user"
      );
      await daiLpPool.setMaxDepositLimitEnabled(false);
    });
  });

  describe('Test single deposit', async () => {
    before('enable pool', async () => {
      await daiLpPool.setPoolEnabled(true);
      await resetBalance();
    });
    it('Deposit', async () => {
      let deposits = [
        {lp: (new BN('10')).mul((new BN('10')).pow(decimals))},
        {lp: (new BN('15')).mul((new BN('10')).pow(decimals))},
        {lp: (new BN('7')).mul((new BN('10')).pow(decimals))},
      ]
      for (let i = 0; i < deposits.length; i += 1) {
        let bal = (new BN('1000')).mul((new BN('10')).pow(decimals));
        await daiLpPool.checkStabilizerAndGetReward("1", "1", "1", bal.toString())
        let debaseReward = bal.mul(new BN(config.debaseRewardPercentage)).div((new BN('10')).pow(decimals));
        await debase.transfer(daiLpPool.address, debaseReward.toString(), {from: policy});

        lpSupply = new BN((await daiDebaseLp.totalSupply()).toString());
        let daiTotal = new BN((await dai.balanceOf(daiDebaseLp.address)).toString());
        let debaseTotal = new BN((await debase.balanceOf(daiDebaseLp.address)).toString());
        await daiDebaseLp.transfer(accounts[i + 1], deposits[i].lp, {from: accounts[0]});
        await daiDebaseLp.approve(daiLpPool.address, deposits[i].lp, {from: accounts[i + 1]});
        await daiLpPool.deposit(deposits[i].lp, {from: accounts[i + 1]});
        assert.equal((await daiLpPool.userDepositLength(accounts[i + 1])), 1);
        assert.equal((await daiLpPool.depositIds(accounts[i + 1], 0)), lastDepositId + i);
      
        assert.equal((await daiDebaseLp.totalSupply()).toString(), (lpSupply.sub(deposits[i].lp)).toString());
        assert.equal((await daiLpPool.lpDeposits(accounts[i + 1])).toString(), deposits[i].lp.toString());    
        assert.equal((await daiLpPool.totalLpLocked()).toString(), deposits[i].lp.toString());
        deposits[i].dai = daiTotal.sub(new BN((await dai.balanceOf(daiDebaseLp.address)).toString()));
        deposits[i].debaseGonBalance = debaseTotal.sub(new BN((await debase.balanceOf(daiDebaseLp.address)))).mul(await getGonsPerFragments());

        let depositInfo = await daiLpPool.deposits(lastDepositId + i);
        assert.equal(depositInfo.owner, accounts[i + 1]);
        assert.equal(depositInfo.amount.toString(), deposits[i].lp.toString());
        assert.equal(depositInfo.daiAmount.toString(), deposits[i].dai.toString());
        // assert.equal(depositInfo.daiAmount, deposits[i].debase);
        assert.equal(depositInfo.daiDepositId, lastDepositId + i + 1);
        assert.equal(depositInfo.mphReward.toString(), "0");
        // assert.equal(depositInfo.mphReward.toString(), deposits[i].dai.div(new BN('2')).toString());
        assert.equal(depositInfo.mphVestingIdx, lastDepositId + i);
        assert.equal(depositInfo.withdrawed, false);

        let mphReward = deposits[i].dai.div(new BN('2'));
        assert.equal((await mph.balanceOf(vesting.address)).toString(), mphReward.toString());

        deposits[i].daiInterest = (new BN('100')).mul((new BN('10')).pow(decimals));
        deposits[i].daiStakingReward = (new BN('50')).mul((new BN('10')).pow(decimals));
        await dInterest.setNextInterest(deposits[i].daiInterest);
        await mphStaking.setNextReward(deposits[i].daiStakingReward);

        await time.increase(config.lockPeriod);
        const oldMphBalance = new BN((await mph.balanceOf(treasury)).toString());
        const oldDaiBalance = new BN((await dai.balanceOf(treasury)).toString());
        await daiLpPool.withdraw(lastDepositId + i, 0, {from: accounts[i + 1]});

        deposits[i].daiStakingReward = deposits[i].daiStakingReward
          .mul(new BN('1000000000000'))
          .div(mphReward)
          .mul(mphReward)
          .div(new BN('1000000000000'))
        depositInfo = await daiLpPool.deposits(lastDepositId + i);
        assert.equal(depositInfo.owner, accounts[i + 1]);
        assert.equal(depositInfo.amount.toString(), deposits[i].lp.toString());
        assert.equal(depositInfo.daiAmount.toString(), deposits[i].dai.toString());
        assert.equal(depositInfo.daiDepositId, lastDepositId + i + 1);
        assert.equal(depositInfo.mphReward.toString(), mphReward.toString());
        assert.equal(depositInfo.mphVestingIdx, lastDepositId + i);
        assert.equal(depositInfo.withdrawed, true);

        let mphRewardRemain = mphReward.sub(mphReward.mul(new BN('30')).div(new BN('100')));
        let mphFee = mphRewardRemain.mul(new BN('200')).div(new BN('1000'));

        assert.equal((await mph.balanceOf(accounts[i + 1])).toString(), mphRewardRemain.sub(mphFee).toString());

        assert.equal((await mph.balanceOf(treasury)).toString(), oldMphBalance.add(mphFee).toString());

        let daiFee = deposits[i].daiInterest.add(deposits[i].daiStakingReward).mul(new BN('300')).div(new BN('1000'));
        assert.equal(
          (await dai.balanceOf(accounts[i + 1])).toString(),
          deposits[i].dai.add(deposits[i].daiInterest).add(deposits[i].daiStakingReward).sub(daiFee).toString());
        assert.equal(
          (await dai.balanceOf(treasury)).toString(), oldDaiBalance.add(daiFee).toString());
        assert.equal(new BN((await debase.balanceOf(accounts[i + 1])).toString()).gt(new BN(deposits[i].debaseGonBalance.div(await getGonsPerFragments()).toString())), true);
      }
    });
  });
});
