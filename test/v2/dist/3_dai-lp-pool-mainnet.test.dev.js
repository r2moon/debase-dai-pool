"use strict";

var BN = require("bn.js");

var truffleContract = require("@truffle/contract");

var _require = require("@openzeppelin/test-helpers"),
    time = _require.time,
    expectRevert = _require.expectRevert;

var config = require("../../config.json");

var DaiLpPoolV2 = artifacts.require("DaiLpPoolV2");

var Debase = artifacts.require("Debase");

var IERC20 = artifacts.require("IERC20");

var UniswapV2FactoryJson = require("@uniswap/v2-core/build/UniswapV2Factory");

var UniswapV2Router02Json = require("@uniswap/v2-periphery/build/UniswapV2Router02");

var UniswapV2PairJson = require("@uniswap/v2-core/build/UniswapV2Pair");

var UniswapV2Factory = truffleContract(UniswapV2FactoryJson);
var UniswapV2Router02 = truffleContract(UniswapV2Router02Json);
var UniswapV2Pair = truffleContract(UniswapV2PairJson);
UniswapV2Factory.setProvider(web3._provider);
UniswapV2Router02.setProvider(web3._provider);
UniswapV2Pair.setProvider(web3._provider);
var decimals = new BN("18");
contract("DaiLpPoolV2 Mainnet testing", function (accounts) {
  var treasury = accounts[9];
  var policy = accounts[0];
  var daiLpPool;
  var dai;
  var debase;
  var mph;
  var uniFactory;
  var uniRouter02;
  var daiDebaseLp;
  var lpSupply;
  var depositAmounts = [new BN("100").mul(new BN("10").pow(decimals))];
  before("Get contract references", function _callee() {
    var lpAddress;
    return regeneratorRuntime.async(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return regeneratorRuntime.awrap(IERC20.at(config.dai));

          case 2:
            dai = _context.sent;
            _context.next = 5;
            return regeneratorRuntime.awrap(IERC20.at(config.mph));

          case 5:
            mph = _context.sent;
            _context.next = 8;
            return regeneratorRuntime.awrap(Debase["new"]());

          case 8:
            debase = _context.sent;
            _context.next = 11;
            return regeneratorRuntime.awrap(UniswapV2Factory.at(config.uniFactory));

          case 11:
            uniFactory = _context.sent;
            _context.next = 14;
            return regeneratorRuntime.awrap(UniswapV2Router02["new"](config.uniFactory, config.weth, {
              from: accounts[0]
            }));

          case 14:
            uniRouter02 = _context.sent;
            _context.next = 17;
            return regeneratorRuntime.awrap(uniRouter02.swapExactETHForTokens(0, [config.weth, config.dai], accounts[0], 7777777777, {
              from: accounts[0],
              value: "100000000000000000000"
            }));

          case 17:
            _context.next = 19;
            return regeneratorRuntime.awrap(debase.approve(uniRouter02.address, "800000000000000000000", {
              from: accounts[0]
            }));

          case 19:
            _context.next = 21;
            return regeneratorRuntime.awrap(dai.approve(uniRouter02.address, "1000000000000000000000", {
              from: accounts[0]
            }));

          case 21:
            _context.next = 23;
            return regeneratorRuntime.awrap(uniRouter02.addLiquidity(debase.address, dai.address, "800000000000000000000", "1000000000000000000000", 0, 0, accounts[0], 7777777777, {
              from: accounts[0]
            }));

          case 23:
            _context.next = 25;
            return regeneratorRuntime.awrap(uniFactory.getPair(dai.address, debase.address));

          case 25:
            lpAddress = _context.sent;
            _context.next = 28;
            return regeneratorRuntime.awrap(IERC20.at(lpAddress));

          case 28:
            daiDebaseLp = _context.sent;
            _context.t0 = BN;
            _context.next = 32;
            return regeneratorRuntime.awrap(daiDebaseLp.totalSupply());

          case 32:
            _context.t1 = _context.sent.toString();
            lpSupply = new _context.t0(_context.t1);
            _context.next = 36;
            return regeneratorRuntime.awrap(DaiLpPoolV2["new"](daiDebaseLp.address, dai.address, debase.address, config.mph, policy, config.daiFixedPool, config.mphVesting, config.lockPeriod, treasury, config.debaseRewardPercentage, config.blockDuration));

          case 36:
            daiLpPool = _context.sent;
            _context.next = 39;
            return regeneratorRuntime.awrap(daiLpPool.setPoolEnabled(true, {
              from: policy
            }));

          case 39:
          case "end":
            return _context.stop();
        }
      }
    });
  });
  it("Check deposit", function _callee2() {
    var mphUserOldBalance, mphTreasureOldBalance, mphUserBalance, mphPoolBalance, mphTreasureBalance, deposit, mphReward;
    return regeneratorRuntime.async(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return regeneratorRuntime.awrap(daiDebaseLp.transfer(accounts[1], depositAmounts[0], {
              from: accounts[0]
            }));

          case 2:
            _context2.next = 4;
            return regeneratorRuntime.awrap(daiDebaseLp.approve(daiLpPool.address, depositAmounts[0], {
              from: accounts[1]
            }));

          case 4:
            _context2.next = 6;
            return regeneratorRuntime.awrap(daiLpPool.deposit(depositAmounts[0], {
              from: accounts[1]
            }));

          case 6:
            _context2.t0 = assert;
            _context2.next = 9;
            return regeneratorRuntime.awrap(daiDebaseLp.totalSupply());

          case 9:
            _context2.t1 = _context2.sent.toString();
            _context2.t2 = lpSupply.sub(depositAmounts[0]).toString();

            _context2.t0.equal.call(_context2.t0, _context2.t1, _context2.t2);

            _context2.t3 = assert;
            _context2.next = 15;
            return regeneratorRuntime.awrap(daiLpPool.lpDeposits(accounts[1]));

          case 15:
            _context2.t4 = _context2.sent.toString();
            _context2.t5 = depositAmounts[0].toString();

            _context2.t3.equal.call(_context2.t3, _context2.t4, _context2.t5);

            _context2.t6 = assert;
            _context2.next = 21;
            return regeneratorRuntime.awrap(daiLpPool.totalLpLocked());

          case 21:
            _context2.t7 = _context2.sent.toString();
            _context2.t8 = depositAmounts[0].toString();

            _context2.t6.equal.call(_context2.t6, _context2.t7, _context2.t8);

            _context2.next = 26;
            return regeneratorRuntime.awrap(time.increase(config.vestingPeriod));

          case 26:
            _context2.t9 = BN;
            _context2.next = 29;
            return regeneratorRuntime.awrap(mph.balanceOf(accounts[1]));

          case 29:
            _context2.t10 = _context2.sent.toString();
            mphUserOldBalance = new _context2.t9(_context2.t10);
            _context2.t11 = BN;
            _context2.next = 34;
            return regeneratorRuntime.awrap(mph.balanceOf(treasury));

          case 34:
            _context2.t12 = _context2.sent.toString();
            mphTreasureOldBalance = new _context2.t11(_context2.t12);
            _context2.next = 38;
            return regeneratorRuntime.awrap(daiLpPool.withdraw(0, 0, {
              from: accounts[1]
            }));

          case 38:
            _context2.t13 = BN;
            _context2.next = 41;
            return regeneratorRuntime.awrap(mph.balanceOf(accounts[1]));

          case 41:
            _context2.t14 = _context2.sent.toString();
            mphUserBalance = new _context2.t13(_context2.t14);
            _context2.t15 = BN;
            _context2.next = 46;
            return regeneratorRuntime.awrap(mph.balanceOf(daiLpPool.address));

          case 46:
            _context2.t16 = _context2.sent.toString();
            mphPoolBalance = new _context2.t15(_context2.t16);
            _context2.t17 = BN;
            _context2.next = 51;
            return regeneratorRuntime.awrap(mph.balanceOf(treasury));

          case 51:
            _context2.t18 = _context2.sent.toString();
            mphTreasureBalance = new _context2.t17(_context2.t18);
            _context2.next = 55;
            return regeneratorRuntime.awrap(daiLpPool.deposits(0));

          case 55:
            deposit = _context2.sent;
            mphReward = new BN(deposit["mphReward"].toString());
            assert.equal(mphUserBalance.sub(mphUserOldBalance).add(mphPoolBalance).add(mphTreasureBalance).sub(mphTreasureOldBalance).toString(), mphReward.toString());
            assert.equal(mphPoolBalance.toString(), mphReward.mul(new BN(config.mphTakingBackMultiplier)).div(new BN("10").pow(new BN("18"))).toString());
            assert.equal(mphTreasureBalance.sub(mphTreasureOldBalance).toString(), mphReward.sub(mphPoolBalance).mul(new BN(config.mphFee.toString())).div(new BN("1000")).toString());
            _context2.next = 62;
            return regeneratorRuntime.awrap(time.increase(config.lockPeriod));

          case 62:
            _context2.next = 64;
            return regeneratorRuntime.awrap(daiLpPool.withdraw(0, 0, {
              from: accounts[1]
            }));

          case 64:
          case "end":
            return _context2.stop();
        }
      }
    });
  });
});