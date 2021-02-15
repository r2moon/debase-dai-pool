const { expectRevert, time } = require('@openzeppelin/test-helpers');

const config = require('../../config.json');
const DaiLpPoolV2 = artifacts.require("DaiLpPoolV2");

contract('DaiLpPoolV2 basic testing', (accounts) => {
  let treasury = accounts[9];
  let daiLpPool;

  before('Get contract references', async () => {
    daiLpPool = await DaiLpPoolV2.new(
      config.debaseDaiPair,
      config.dai,
      config.debase,
      config.mph,
      config.policy,
      config.daiFixedPool,
      config.mphVesting,
      config.lockPeriod,
      treasury,
      config.debaseRewardPercentage,
      config.blockDuration
    );
  });

  describe('Initial settings check', function() {
    it('Pair token should be debase-dai uni v2 lp', async function() {
      assert.equal(await daiLpPool.debaseDaiPair(), config.debaseDaiPair);
    });
    it('Dai fixed pool should be 88mph dai fixed pool', async function() {
      assert.equal(await daiLpPool.daiFixedPool(), config.daiFixedPool);
    });
    it('Mph vesting should be 88mph vesting', async function() {
      assert.equal(await daiLpPool.mphVesting(), config.mphVesting);
    });
    it('Check dai token', async function() {
      assert.equal(await daiLpPool.dai(), config.dai);
    });
    it('Check debase token', async function() {
      assert.equal(await daiLpPool.debase(), config.debase);
    });
    it('Check mph token', async function() {
      assert.equal(await daiLpPool.mph(), config.mph);
    });
    it('Policy should be policy contract', async function() {
      assert.equal(await daiLpPool.policy(), config.policy);
    });
    it('Max deposit limit should be zero', async function() {
      assert.equal(await daiLpPool.maxDepositLimit(), 0);
    });
    it('Total lp limit should be zero', async function() {
      assert.equal(await daiLpPool.totalLpLimit(), 0);
    });
    it('Check lock period', async function() {
      assert.equal((await daiLpPool.lockPeriod()).toString(), config.lockPeriod.toString());
    });
    it('TotalLpLimitEnabled should be false', async function() {
      assert.equal(await daiLpPool.totalLpLimitEnabled(), false);
    });
    it('MaxDepositLimitEnabled should be false', async function() {
      assert.equal(await daiLpPool.maxDepositLimitEnabled(), false);
    });
    it('TotalLpLocked should be zero', async function() {
      assert.equal(await daiLpPool.totalLpLocked(), 0);
    });
    it('DepositLength should be zero', async function() {
      assert.equal(await daiLpPool.depositLength(), 0);
    });
    it('Check tresury', async function() {
      assert.equal((await daiLpPool.treasury()).toString(), treasury);
    });
    it('Check periodFinish', async function() {
      assert.equal(await daiLpPool.periodFinish(), 0);
    });
    it('Check debaseRewardRate', async function() {
      assert.equal(await daiLpPool.debaseRewardRate(), 0);
    });
    it('Check lastUpdateBlock', async function() {
      assert.equal(await daiLpPool.lastUpdateBlock(), 0);
    });
    it('Check debaseRewardPerTokenStored', async function() {
      assert.equal(await daiLpPool.debaseRewardPerTokenStored(), 0);
    });
    it('Check debaseRewardPercentage', async function() {
      assert.equal(await daiLpPool.debaseRewardPercentage(), config.debaseRewardPercentage);
    });
    it('Check debaseRewardDistributed', async function() {
      assert.equal(await daiLpPool.debaseRewardDistributed(), 0);
    });
    it('Check blockDuration', async function() {
      assert.equal(await daiLpPool.blockDuration(), config.blockDuration);
    });
    it('Check poolEnabled', async function() {
      assert.equal(await daiLpPool.poolEnabled(), false);
    });
    it('Check mphTakeBackMultiplier', async function() {
      assert.equal((await daiLpPool.mphTakeBackMultiplier()).toString(), "300000000000000000");
    });
  });

  describe('setters check', function() {
    it('check setRewardPercentage', async function() {
      await expectRevert(
        daiLpPool.setRewardPercentage(10, {from: accounts[2]}),
        'Ownable: caller is not the owner'
      );
      await daiLpPool.setRewardPercentage(10, {from: accounts[0]});
      assert.equal(await daiLpPool.debaseRewardPercentage(), 10);
    });
    it('check setBlockDuration', async function() {
      await expectRevert(
        daiLpPool.setBlockDuration(10, {from: accounts[2]}),
        'Ownable: caller is not the owner'
      );
      await expectRevert(
        daiLpPool.setBlockDuration(0, {from: accounts[0]}),
        'invalid duration'
      );
      await daiLpPool.setBlockDuration(10, {from: accounts[0]});
      assert.equal(await daiLpPool.blockDuration(), 10);
    });
    it('check setPoolEnabled', async function() {
      await expectRevert(
        daiLpPool.setPoolEnabled(true, {from: accounts[2]}),
        'Ownable: caller is not the owner'
      );
      await daiLpPool.setPoolEnabled(true, {from: accounts[0]});
      assert.equal(await daiLpPool.poolEnabled(), true);
      await daiLpPool.setPoolEnabled(false, {from: accounts[0]});
      assert.equal(await daiLpPool.poolEnabled(), false);
    });
    it('check setDaiFee', async function() {
      await expectRevert(
        daiLpPool.setDaiFee(10, {from: accounts[2]}),
        'Ownable: caller is not the owner'
      );
      await daiLpPool.setDaiFee(10, {from: accounts[0]});
      assert.equal(await daiLpPool.daiFee(), 10);
    });
    it('check setMphFee', async function() {
      await expectRevert(
        daiLpPool.setMphFee(10, {from: accounts[2]}),
        'Ownable: caller is not the owner'
      );
      await daiLpPool.setMphFee(10, {from: accounts[0]});
      assert.equal(await daiLpPool.mphFee(), 10);
    });
    it('check setTreasury', async function() {
      await expectRevert(
        daiLpPool.setTreasury(accounts[1], {from: accounts[2]}),
        'Ownable: caller is not the owner'
      );
      await expectRevert(
        daiLpPool.setTreasury("0x0000000000000000000000000000000000000000", {from: accounts[0]}),
        'Invalid addr'
      );
      await daiLpPool.setTreasury(accounts[1], {from: accounts[0]});
      assert.equal(await daiLpPool.treasury(), accounts[1]);
    });
    it('check setPolicy', async function() {
      await expectRevert(
        daiLpPool.setPolicy(accounts[1], {from: accounts[2]}),
        'Ownable: caller is not the owner'
      );
      await expectRevert(
        daiLpPool.setPolicy("0x0000000000000000000000000000000000000000", {from: accounts[0]}),
        'Invalid addr'
      );
      await daiLpPool.setPolicy(accounts[1], {from: accounts[0]});
      assert.equal(await daiLpPool.policy(), accounts[1]);
    });
    it('check setMaxDepositLimit', async function() {
      await expectRevert(
        daiLpPool.setMaxDepositLimit(10, {from: accounts[2]}),
        'Ownable: caller is not the owner'
      );
      await daiLpPool.setMaxDepositLimit(10, {from: accounts[0]});
      assert.equal(await daiLpPool.maxDepositLimit(), 10);
    });
    it('check setMaxDepositLimitEnabled', async function() {
      await expectRevert(
        daiLpPool.setMaxDepositLimitEnabled(true, {from: accounts[2]}),
        'Ownable: caller is not the owner'
      );
      await daiLpPool.setMaxDepositLimitEnabled(true, {from: accounts[0]});
      assert.equal(await daiLpPool.maxDepositLimitEnabled(), true);
      await daiLpPool.setMaxDepositLimitEnabled(false, {from: accounts[0]});
      assert.equal(await daiLpPool.maxDepositLimitEnabled(), false);
    });
    it('check setTotalLpLimit', async function() {
      await expectRevert(
        daiLpPool.setTotalLpLimit(10, {from: accounts[2]}),
        'Ownable: caller is not the owner'
      );
      await daiLpPool.setTotalLpLimit(10, {from: accounts[0]});
      assert.equal(await daiLpPool.totalLpLimit(), 10);
    });
    it('check setTotalLpLimitEnabled', async function() {
      await expectRevert(
        daiLpPool.setTotalLpLimitEnabled(true, {from: accounts[2]}),
        'Ownable: caller is not the owner'
      );
      await daiLpPool.setTotalLpLimitEnabled(true, {from: accounts[0]});
      assert.equal(await daiLpPool.totalLpLimitEnabled(), true);
      await daiLpPool.setTotalLpLimitEnabled(false, {from: accounts[0]});
      assert.equal(await daiLpPool.totalLpLimitEnabled(), false);
    });
    it('check setMaxDepositLimit', async function() {
      await expectRevert(
        daiLpPool.setLockPeriod(10, {from: accounts[2]}),
        'Ownable: caller is not the owner'
      );
      await expectRevert(
        daiLpPool.setLockPeriod(0, {from: accounts[0]}),
        'invalid lock period'
      );
      await daiLpPool.setLockPeriod(10, {from: accounts[0]});
      assert.equal(await daiLpPool.lockPeriod(), 10);
    });
    it('check setMphTakeBackMultiplier', async function() {
      await expectRevert(
        daiLpPool.setMphTakeBackMultiplier("1000000000000000000", {from: accounts[2]}),
        'Ownable: caller is not the owner'
      );
      await daiLpPool.setMphTakeBackMultiplier("1000000000000000000", {from: accounts[0]});
      assert.equal((await daiLpPool.mphTakeBackMultiplier()).toString(), "1000000000000000000");
    });
  });
});
