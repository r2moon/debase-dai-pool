"use strict";

var BN = require('bn.js');

var truffleContract = require('@truffle/contract');

var _require = require('@openzeppelin/test-helpers'),
    expectRevert = _require.expectRevert,
    send = _require.send,
    balance = _require.balance,
    time = _require.time;

var config = require('../../config.json');

var DaiLpPoolV2 = artifacts.require("DaiLpPoolV2");

var Debase = artifacts.require("Debase");

var IERC20 = artifacts.require("IERC20");

var TestERC20 = artifacts.require("TestERC20");

var Vesting = artifacts.require("Vesting");

var FakeMphMinter = artifacts.require("FakeMphMinter");

var FakeDInterest = artifacts.require("FakeDInterest");

var UniswapV2FactoryJson = require("@uniswap/v2-core/build/UniswapV2Factory");

var UniswapV2Router02Json = require("@uniswap/v2-periphery/build/UniswapV2Router02");

var UniswapV2PairJson = require("@uniswap/v2-core/build/UniswapV2Pair");

var UniswapV2Factory = truffleContract(UniswapV2FactoryJson);
var UniswapV2Router02 = truffleContract(UniswapV2Router02Json);
var UniswapV2Pair = truffleContract(UniswapV2PairJson);
UniswapV2Factory.setProvider(web3._provider);
UniswapV2Router02.setProvider(web3._provider);
UniswapV2Pair.setProvider(web3._provider);
var decimals = new BN('18');
contract('DaiLpPoolV2 Mock testing', function (accounts) {
  var treasury = accounts[9];
  var policy = accounts[0];
  var daiLpPool;
  var dInterest;
  var vesting;
  var dai;
  var debase;
  var mph;
  var uniFactory;
  var uniRouter02;
  var daiDebaseLp;
  var lpSupply;
  var lastDepositId = 0;

  var resetBalance = function resetBalance() {
    var i, daiBal, debaseBal, lpBal;
    return regeneratorRuntime.async(function resetBalance$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            i = 1;

          case 1:
            if (!(i < 10)) {
              _context.next = 20;
              break;
            }

            _context.next = 4;
            return regeneratorRuntime.awrap(dai.balanceOf(accounts[i]));

          case 4:
            daiBal = _context.sent.toString();
            _context.next = 7;
            return regeneratorRuntime.awrap(dai.transfer(policy, daiBal, {
              from: accounts[i]
            }));

          case 7:
            _context.next = 9;
            return regeneratorRuntime.awrap(debase.balanceOf(accounts[i]));

          case 9:
            debaseBal = _context.sent.toString();
            _context.next = 12;
            return regeneratorRuntime.awrap(debase.transfer(policy, debaseBal, {
              from: accounts[i]
            }));

          case 12:
            _context.next = 14;
            return regeneratorRuntime.awrap(daiDebaseLp.balanceOf(accounts[i]));

          case 14:
            lpBal = _context.sent.toString();
            _context.next = 17;
            return regeneratorRuntime.awrap(daiDebaseLp.transfer(policy, lpBal, {
              from: accounts[i]
            }));

          case 17:
            i += 1;
            _context.next = 1;
            break;

          case 20:
          case "end":
            return _context.stop();
        }
      }
    });
  };

  var getGonsPerFragments = function getGonsPerFragments() {
    var MAX_UINT256, INITIAL_FRAGMENTS_SUPPLY, TOTAL_GONS, totalSupply;
    return regeneratorRuntime.async(function getGonsPerFragments$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            MAX_UINT256 = new BN('2').pow(new BN('256')).sub(new BN('1'));
            INITIAL_FRAGMENTS_SUPPLY = new BN('1000000').mul(new BN('10').pow(decimals));
            TOTAL_GONS = MAX_UINT256.sub(MAX_UINT256.mod(INITIAL_FRAGMENTS_SUPPLY));
            _context2.t0 = BN;
            _context2.next = 6;
            return regeneratorRuntime.awrap(debase.totalSupply());

          case 6:
            _context2.t1 = _context2.sent.toString();
            totalSupply = new _context2.t0(_context2.t1);
            return _context2.abrupt("return", TOTAL_GONS.div(totalSupply));

          case 9:
          case "end":
            return _context2.stop();
        }
      }
    });
  };

  before('Get contract references', function _callee() {
    var mphMinter, lpAddress;
    return regeneratorRuntime.async(function _callee$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return regeneratorRuntime.awrap(TestERC20["new"](new BN('10000000').mul(new BN('10').pow(decimals)).toString(), "Test dai", "DAI"));

          case 2:
            dai = _context3.sent;
            _context3.next = 5;
            return regeneratorRuntime.awrap(Debase["new"]());

          case 5:
            debase = _context3.sent;
            _context3.next = 8;
            return regeneratorRuntime.awrap(TestERC20["new"](new BN('10000000').mul(new BN('10').pow(decimals)).toString(), "Test Mph", "MPH"));

          case 8:
            mph = _context3.sent;
            _context3.next = 11;
            return regeneratorRuntime.awrap(Vesting["new"](mph.address, {
              from: accounts[0]
            }));

          case 11:
            vesting = _context3.sent;
            _context3.next = 14;
            return regeneratorRuntime.awrap(FakeMphMinter["new"](mph.address, vesting.address, {
              from: accounts[0]
            }));

          case 14:
            mphMinter = _context3.sent;
            _context3.next = 17;
            return regeneratorRuntime.awrap(FakeDInterest["new"](dai.address, mphMinter.address, {
              from: accounts[0]
            }));

          case 17:
            dInterest = _context3.sent;
            _context3.next = 20;
            return regeneratorRuntime.awrap(dai.approve(dInterest.address, new BN('10000000').mul(new BN('10').pow(decimals)).toString(), {
              from: accounts[0]
            }));

          case 20:
            _context3.next = 22;
            return regeneratorRuntime.awrap(UniswapV2Factory["new"](treasury, {
              from: accounts[0]
            }));

          case 22:
            uniFactory = _context3.sent;
            _context3.next = 25;
            return regeneratorRuntime.awrap(UniswapV2Router02["new"](uniFactory.address, config.weth, {
              from: accounts[0]
            }));

          case 25:
            uniRouter02 = _context3.sent;
            _context3.next = 28;
            return regeneratorRuntime.awrap(debase.approve(uniRouter02.address, "8000000000000000000000", {
              from: accounts[0]
            }));

          case 28:
            _context3.next = 30;
            return regeneratorRuntime.awrap(dai.approve(uniRouter02.address, "10000000000000000000000", {
              from: accounts[0]
            }));

          case 30:
            _context3.next = 32;
            return regeneratorRuntime.awrap(uniRouter02.addLiquidity(debase.address, dai.address, "8000000000000000000000", "10000000000000000000000", 0, 0, accounts[0], 7777777777, {
              from: accounts[0]
            }));

          case 32:
            _context3.next = 34;
            return regeneratorRuntime.awrap(uniFactory.getPair(dai.address, debase.address));

          case 34:
            lpAddress = _context3.sent;
            _context3.next = 37;
            return regeneratorRuntime.awrap(IERC20.at(lpAddress));

          case 37:
            daiDebaseLp = _context3.sent;
            _context3.t0 = BN;
            _context3.next = 41;
            return regeneratorRuntime.awrap(daiDebaseLp.totalSupply());

          case 41:
            _context3.t1 = _context3.sent.toString();
            lpSupply = new _context3.t0(_context3.t1);
            _context3.next = 45;
            return regeneratorRuntime.awrap(DaiLpPoolV2["new"](daiDebaseLp.address, dai.address, debase.address, mph.address, policy, dInterest.address, vesting.address, config.lockPeriod, treasury, config.debaseRewardPercentage, config.blockDuration));

          case 45:
            daiLpPool = _context3.sent;
            _context3.next = 48;
            return regeneratorRuntime.awrap(daiLpPool.setPoolEnabled(true, {
              from: policy
            }));

          case 48:
            _context3.next = 50;
            return regeneratorRuntime.awrap(daiLpPool.setMphFee(200, {
              from: policy
            }));

          case 50:
          case "end":
            return _context3.stop();
        }
      }
    });
  });
  describe('Test limitations', function _callee6() {
    var deposit;
    return regeneratorRuntime.async(function _callee6$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            deposit = new BN('10').mul(new BN('10').pow(decimals));
            before('Send lp to account', function _callee2() {
              return regeneratorRuntime.async(function _callee2$(_context4) {
                while (1) {
                  switch (_context4.prev = _context4.next) {
                    case 0:
                      _context4.next = 2;
                      return regeneratorRuntime.awrap(daiDebaseLp.transfer(accounts[8], deposit, {
                        from: accounts[0]
                      }));

                    case 2:
                      _context4.next = 4;
                      return regeneratorRuntime.awrap(daiDebaseLp.approve(daiLpPool.address, deposit, {
                        from: accounts[8]
                      }));

                    case 4:
                    case "end":
                      return _context4.stop();
                  }
                }
              });
            });
            it('enable/disable pools', function _callee3() {
              return regeneratorRuntime.async(function _callee3$(_context5) {
                while (1) {
                  switch (_context5.prev = _context5.next) {
                    case 0:
                      _context5.next = 2;
                      return regeneratorRuntime.awrap(daiLpPool.setPoolEnabled(false));

                    case 2:
                      _context5.next = 4;
                      return regeneratorRuntime.awrap(expectRevert(daiLpPool.deposit(deposit, {
                        from: accounts[8]
                      }), "Pool isn't enabled"));

                    case 4:
                      _context5.next = 6;
                      return regeneratorRuntime.awrap(daiLpPool.setPoolEnabled(true));

                    case 6:
                      _context5.next = 8;
                      return regeneratorRuntime.awrap(daiLpPool.deposit(deposit, {
                        from: accounts[8]
                      }));

                    case 8:
                      _context5.t0 = assert;
                      _context5.next = 11;
                      return regeneratorRuntime.awrap(daiLpPool.userDepositLength(accounts[8]));

                    case 11:
                      _context5.t1 = _context5.sent;

                      _context5.t0.equal.call(_context5.t0, _context5.t1, 1);

                      _context5.t2 = assert;
                      _context5.next = 16;
                      return regeneratorRuntime.awrap(daiLpPool.depositIds(accounts[8], 0));

                    case 16:
                      _context5.t3 = _context5.sent;

                      _context5.t2.equal.call(_context5.t2, _context5.t3, 0);

                      lastDepositId += 1;
                      _context5.next = 21;
                      return regeneratorRuntime.awrap(time.increase(config.lockPeriod));

                    case 21:
                      _context5.next = 23;
                      return regeneratorRuntime.awrap(daiLpPool.withdraw(0, 0, {
                        from: accounts[8]
                      }));

                    case 23:
                    case "end":
                      return _context5.stop();
                  }
                }
              });
            });
            it('enable/disable total lp limit', function _callee4() {
              return regeneratorRuntime.async(function _callee4$(_context6) {
                while (1) {
                  switch (_context6.prev = _context6.next) {
                    case 0:
                      _context6.next = 2;
                      return regeneratorRuntime.awrap(daiLpPool.setTotalLpLimitEnabled(true));

                    case 2:
                      _context6.next = 4;
                      return regeneratorRuntime.awrap(daiLpPool.setTotalLpLimit(new BN('9').mul(new BN('10').pow(decimals))));

                    case 4:
                      _context6.next = 6;
                      return regeneratorRuntime.awrap(expectRevert(daiLpPool.deposit(deposit, {
                        from: accounts[8]
                      }), "To much lp locked"));

                    case 6:
                      _context6.next = 8;
                      return regeneratorRuntime.awrap(daiLpPool.setTotalLpLimitEnabled(false));

                    case 8:
                    case "end":
                      return _context6.stop();
                  }
                }
              });
            });
            it('enable/disable total lp limit', function _callee5() {
              return regeneratorRuntime.async(function _callee5$(_context7) {
                while (1) {
                  switch (_context7.prev = _context7.next) {
                    case 0:
                      _context7.next = 2;
                      return regeneratorRuntime.awrap(daiLpPool.setMaxDepositLimitEnabled(true));

                    case 2:
                      _context7.next = 4;
                      return regeneratorRuntime.awrap(daiLpPool.setMaxDepositLimit(new BN('9').mul(new BN('10').pow(decimals))));

                    case 4:
                      _context7.next = 6;
                      return regeneratorRuntime.awrap(expectRevert(daiLpPool.deposit(deposit, {
                        from: accounts[8]
                      }), "to much deposit for this user"));

                    case 6:
                      _context7.next = 8;
                      return regeneratorRuntime.awrap(daiLpPool.setMaxDepositLimitEnabled(false));

                    case 8:
                    case "end":
                      return _context7.stop();
                  }
                }
              });
            });

          case 5:
          case "end":
            return _context8.stop();
        }
      }
    });
  });
  describe('Test single deposit', function _callee9() {
    return regeneratorRuntime.async(function _callee9$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            before('enable pool', function _callee7() {
              return regeneratorRuntime.async(function _callee7$(_context9) {
                while (1) {
                  switch (_context9.prev = _context9.next) {
                    case 0:
                      _context9.next = 2;
                      return regeneratorRuntime.awrap(daiLpPool.setPoolEnabled(true));

                    case 2:
                      _context9.next = 4;
                      return regeneratorRuntime.awrap(resetBalance());

                    case 4:
                    case "end":
                      return _context9.stop();
                  }
                }
              });
            });
            it('Deposit', function _callee8() {
              var deposits, i, bal, debaseReward, daiTotal, debaseTotal, depositInfo, mphReward, oldMphBalance, oldDaiBalance, mphRewardRemain, mphFee, daiFee;
              return regeneratorRuntime.async(function _callee8$(_context10) {
                while (1) {
                  switch (_context10.prev = _context10.next) {
                    case 0:
                      deposits = [{
                        lp: new BN('10').mul(new BN('10').pow(decimals))
                      }, {
                        lp: new BN('15').mul(new BN('10').pow(decimals))
                      }, {
                        lp: new BN('7').mul(new BN('10').pow(decimals))
                      }];
                      i = 0;

                    case 2:
                      if (!(i < deposits.length)) {
                        _context10.next = 166;
                        break;
                      }

                      bal = new BN('1000').mul(new BN('10').pow(decimals));
                      _context10.next = 6;
                      return regeneratorRuntime.awrap(daiLpPool.checkStabilizerAndGetReward("1", "1", "1", bal.toString()));

                    case 6:
                      debaseReward = bal.mul(new BN(config.debaseRewardPercentage)).div(new BN('10').pow(decimals));
                      _context10.next = 9;
                      return regeneratorRuntime.awrap(debase.transfer(daiLpPool.address, debaseReward.toString(), {
                        from: policy
                      }));

                    case 9:
                      _context10.t0 = BN;
                      _context10.next = 12;
                      return regeneratorRuntime.awrap(daiDebaseLp.totalSupply());

                    case 12:
                      _context10.t1 = _context10.sent.toString();
                      lpSupply = new _context10.t0(_context10.t1);
                      _context10.t2 = BN;
                      _context10.next = 17;
                      return regeneratorRuntime.awrap(dai.balanceOf(daiDebaseLp.address));

                    case 17:
                      _context10.t3 = _context10.sent.toString();
                      daiTotal = new _context10.t2(_context10.t3);
                      _context10.t4 = BN;
                      _context10.next = 22;
                      return regeneratorRuntime.awrap(debase.balanceOf(daiDebaseLp.address));

                    case 22:
                      _context10.t5 = _context10.sent.toString();
                      debaseTotal = new _context10.t4(_context10.t5);
                      _context10.next = 26;
                      return regeneratorRuntime.awrap(daiDebaseLp.transfer(accounts[i + 1], deposits[i].lp, {
                        from: accounts[0]
                      }));

                    case 26:
                      _context10.next = 28;
                      return regeneratorRuntime.awrap(daiDebaseLp.approve(daiLpPool.address, deposits[i].lp, {
                        from: accounts[i + 1]
                      }));

                    case 28:
                      _context10.next = 30;
                      return regeneratorRuntime.awrap(daiLpPool.deposit(deposits[i].lp, {
                        from: accounts[i + 1]
                      }));

                    case 30:
                      _context10.t6 = assert;
                      _context10.next = 33;
                      return regeneratorRuntime.awrap(daiLpPool.userDepositLength(accounts[i + 1]));

                    case 33:
                      _context10.t7 = _context10.sent;

                      _context10.t6.equal.call(_context10.t6, _context10.t7, 1);

                      _context10.t8 = assert;
                      _context10.next = 38;
                      return regeneratorRuntime.awrap(daiLpPool.depositIds(accounts[i + 1], 0));

                    case 38:
                      _context10.t9 = _context10.sent;
                      _context10.t10 = lastDepositId + i;

                      _context10.t8.equal.call(_context10.t8, _context10.t9, _context10.t10);

                      _context10.t11 = assert;
                      _context10.next = 44;
                      return regeneratorRuntime.awrap(daiDebaseLp.totalSupply());

                    case 44:
                      _context10.t12 = _context10.sent.toString();
                      _context10.t13 = lpSupply.sub(deposits[i].lp).toString();

                      _context10.t11.equal.call(_context10.t11, _context10.t12, _context10.t13);

                      _context10.t14 = assert;
                      _context10.next = 50;
                      return regeneratorRuntime.awrap(daiLpPool.lpDeposits(accounts[i + 1]));

                    case 50:
                      _context10.t15 = _context10.sent.toString();
                      _context10.t16 = deposits[i].lp.toString();

                      _context10.t14.equal.call(_context10.t14, _context10.t15, _context10.t16);

                      _context10.t17 = assert;
                      _context10.next = 56;
                      return regeneratorRuntime.awrap(daiLpPool.totalLpLocked());

                    case 56:
                      _context10.t18 = _context10.sent.toString();
                      _context10.t19 = deposits[i].lp.toString();

                      _context10.t17.equal.call(_context10.t17, _context10.t18, _context10.t19);

                      _context10.t20 = daiTotal;
                      _context10.t21 = BN;
                      _context10.next = 63;
                      return regeneratorRuntime.awrap(dai.balanceOf(daiDebaseLp.address));

                    case 63:
                      _context10.t22 = _context10.sent.toString();
                      _context10.t23 = new _context10.t21(_context10.t22);
                      deposits[i].dai = _context10.t20.sub.call(_context10.t20, _context10.t23);
                      _context10.t25 = debaseTotal;
                      _context10.t26 = BN;
                      _context10.next = 70;
                      return regeneratorRuntime.awrap(debase.balanceOf(daiDebaseLp.address));

                    case 70:
                      _context10.t27 = _context10.sent;
                      _context10.t28 = new _context10.t26(_context10.t27);
                      _context10.t24 = _context10.t25.sub.call(_context10.t25, _context10.t28);
                      _context10.next = 75;
                      return regeneratorRuntime.awrap(getGonsPerFragments());

                    case 75:
                      _context10.t29 = _context10.sent;
                      deposits[i].debaseGonBalance = _context10.t24.mul.call(_context10.t24, _context10.t29);
                      _context10.next = 79;
                      return regeneratorRuntime.awrap(daiLpPool.deposits(lastDepositId + i));

                    case 79:
                      depositInfo = _context10.sent;
                      assert.equal(depositInfo.owner, accounts[i + 1]);
                      assert.equal(depositInfo.amount.toString(), deposits[i].lp.toString());
                      assert.equal(depositInfo.daiAmount.toString(), deposits[i].dai.toString()); // assert.equal(depositInfo.daiAmount, deposits[i].debase);

                      assert.equal(depositInfo.daiDepositId, lastDepositId + i + 1);
                      assert.equal(depositInfo.mphReward.toString(), "0"); // assert.equal(depositInfo.mphReward.toString(), deposits[i].dai.div(new BN('2')).toString());

                      assert.equal(depositInfo.mphVestingIdx, lastDepositId + i);
                      assert.equal(depositInfo.withdrawed, false);
                      mphReward = deposits[i].dai.div(new BN('2'));
                      _context10.t30 = assert;
                      _context10.next = 91;
                      return regeneratorRuntime.awrap(mph.balanceOf(vesting.address));

                    case 91:
                      _context10.t31 = _context10.sent.toString();
                      _context10.t32 = mphReward.toString();

                      _context10.t30.equal.call(_context10.t30, _context10.t31, _context10.t32);

                      deposits[i].daiInterest = new BN('100').mul(new BN('10').pow(decimals));
                      _context10.next = 97;
                      return regeneratorRuntime.awrap(dInterest.setNextInterest(deposits[i].daiInterest));

                    case 97:
                      _context10.next = 99;
                      return regeneratorRuntime.awrap(time.increase(config.lockPeriod));

                    case 99:
                      _context10.t33 = BN;
                      _context10.next = 102;
                      return regeneratorRuntime.awrap(mph.balanceOf(treasury));

                    case 102:
                      _context10.t34 = _context10.sent.toString();
                      oldMphBalance = new _context10.t33(_context10.t34);
                      _context10.t35 = BN;
                      _context10.next = 107;
                      return regeneratorRuntime.awrap(dai.balanceOf(treasury));

                    case 107:
                      _context10.t36 = _context10.sent.toString();
                      oldDaiBalance = new _context10.t35(_context10.t36);
                      _context10.next = 111;
                      return regeneratorRuntime.awrap(daiLpPool.withdraw(lastDepositId + i, 0, {
                        from: accounts[i + 1]
                      }));

                    case 111:
                      _context10.next = 113;
                      return regeneratorRuntime.awrap(daiLpPool.deposits(lastDepositId + i));

                    case 113:
                      depositInfo = _context10.sent;
                      assert.equal(depositInfo.owner, accounts[i + 1]);
                      assert.equal(depositInfo.amount.toString(), deposits[i].lp.toString());
                      assert.equal(depositInfo.daiAmount.toString(), deposits[i].dai.toString());
                      assert.equal(depositInfo.daiDepositId, lastDepositId + i + 1);
                      assert.equal(depositInfo.mphReward.toString(), mphReward.toString());
                      assert.equal(depositInfo.mphVestingIdx, lastDepositId + i);
                      assert.equal(depositInfo.withdrawed, true);
                      mphRewardRemain = mphReward.sub(mphReward.mul(new BN('30')).div(new BN('100')));
                      mphFee = mphRewardRemain.mul(new BN('200')).div(new BN('1000'));
                      _context10.t37 = assert;
                      _context10.next = 126;
                      return regeneratorRuntime.awrap(mph.balanceOf(accounts[i + 1]));

                    case 126:
                      _context10.t38 = _context10.sent.toString();
                      _context10.t39 = mphRewardRemain.sub(mphFee).toString();

                      _context10.t37.equal.call(_context10.t37, _context10.t38, _context10.t39);

                      _context10.t40 = assert;
                      _context10.next = 132;
                      return regeneratorRuntime.awrap(mph.balanceOf(treasury));

                    case 132:
                      _context10.t41 = _context10.sent.toString();
                      _context10.t42 = oldMphBalance.add(mphFee).toString();

                      _context10.t40.equal.call(_context10.t40, _context10.t41, _context10.t42);

                      daiFee = deposits[i].daiInterest.mul(new BN('300')).div(new BN('1000'));
                      _context10.t43 = assert;
                      _context10.next = 139;
                      return regeneratorRuntime.awrap(dai.balanceOf(accounts[i + 1]));

                    case 139:
                      _context10.t44 = _context10.sent.toString();
                      _context10.t45 = deposits[i].dai.add(deposits[i].daiInterest).sub(daiFee).toString();

                      _context10.t43.equal.call(_context10.t43, _context10.t44, _context10.t45);

                      _context10.t46 = assert;
                      _context10.next = 145;
                      return regeneratorRuntime.awrap(dai.balanceOf(treasury));

                    case 145:
                      _context10.t47 = _context10.sent.toString();
                      _context10.t48 = oldDaiBalance.add(daiFee).toString();

                      _context10.t46.equal.call(_context10.t46, _context10.t47, _context10.t48);

                      _context10.t49 = assert;
                      _context10.t51 = BN;
                      _context10.next = 152;
                      return regeneratorRuntime.awrap(debase.balanceOf(accounts[i + 1]));

                    case 152:
                      _context10.t52 = _context10.sent.toString();
                      _context10.t50 = new _context10.t51(_context10.t52);
                      _context10.t53 = BN;
                      _context10.t54 = deposits[i].debaseGonBalance;
                      _context10.next = 158;
                      return regeneratorRuntime.awrap(getGonsPerFragments());

                    case 158:
                      _context10.t55 = _context10.sent;
                      _context10.t56 = _context10.t54.div.call(_context10.t54, _context10.t55).toString();
                      _context10.t57 = new _context10.t53(_context10.t56);
                      _context10.t58 = _context10.t50.gt.call(_context10.t50, _context10.t57);

                      _context10.t49.equal.call(_context10.t49, _context10.t58, true);

                    case 163:
                      i += 1;
                      _context10.next = 2;
                      break;

                    case 166:
                    case "end":
                      return _context10.stop();
                  }
                }
              });
            });

          case 2:
          case "end":
            return _context11.stop();
        }
      }
    });
  });
});