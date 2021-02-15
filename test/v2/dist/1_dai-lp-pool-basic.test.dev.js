"use strict";

var _require = require('@openzeppelin/test-helpers'),
    expectRevert = _require.expectRevert,
    time = _require.time;

var config = require('../../config.json');

var DaiLpPoolV2 = artifacts.require("DaiLpPoolV2");

contract('DaiLpPoolV2 basic testing', function (accounts) {
  var treasury = accounts[9];
  var daiLpPool;
  before('Get contract references', function _callee() {
    return regeneratorRuntime.async(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return regeneratorRuntime.awrap(DaiLpPoolV2["new"](config.debaseDaiPair, config.dai, config.debase, config.mph, config.policy, config.daiFixedPool, config.mphVesting, config.lockPeriod, treasury, config.debaseRewardPercentage, config.blockDuration));

          case 2:
            daiLpPool = _context.sent;

          case 3:
          case "end":
            return _context.stop();
        }
      }
    });
  });
  describe('Initial settings check', function () {
    it('Pair token should be debase-dai uni v2 lp', function _callee2() {
      return regeneratorRuntime.async(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.t0 = assert;
              _context2.next = 3;
              return regeneratorRuntime.awrap(daiLpPool.debaseDaiPair());

            case 3:
              _context2.t1 = _context2.sent;
              _context2.t2 = config.debaseDaiPair;

              _context2.t0.equal.call(_context2.t0, _context2.t1, _context2.t2);

            case 6:
            case "end":
              return _context2.stop();
          }
        }
      });
    });
    it('Dai fixed pool should be 88mph dai fixed pool', function _callee3() {
      return regeneratorRuntime.async(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.t0 = assert;
              _context3.next = 3;
              return regeneratorRuntime.awrap(daiLpPool.daiFixedPool());

            case 3:
              _context3.t1 = _context3.sent;
              _context3.t2 = config.daiFixedPool;

              _context3.t0.equal.call(_context3.t0, _context3.t1, _context3.t2);

            case 6:
            case "end":
              return _context3.stop();
          }
        }
      });
    });
    it('Mph vesting should be 88mph vesting', function _callee4() {
      return regeneratorRuntime.async(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.t0 = assert;
              _context4.next = 3;
              return regeneratorRuntime.awrap(daiLpPool.mphVesting());

            case 3:
              _context4.t1 = _context4.sent;
              _context4.t2 = config.mphVesting;

              _context4.t0.equal.call(_context4.t0, _context4.t1, _context4.t2);

            case 6:
            case "end":
              return _context4.stop();
          }
        }
      });
    });
    it('Check dai token', function _callee5() {
      return regeneratorRuntime.async(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              _context5.t0 = assert;
              _context5.next = 3;
              return regeneratorRuntime.awrap(daiLpPool.dai());

            case 3:
              _context5.t1 = _context5.sent;
              _context5.t2 = config.dai;

              _context5.t0.equal.call(_context5.t0, _context5.t1, _context5.t2);

            case 6:
            case "end":
              return _context5.stop();
          }
        }
      });
    });
    it('Check debase token', function _callee6() {
      return regeneratorRuntime.async(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              _context6.t0 = assert;
              _context6.next = 3;
              return regeneratorRuntime.awrap(daiLpPool.debase());

            case 3:
              _context6.t1 = _context6.sent;
              _context6.t2 = config.debase;

              _context6.t0.equal.call(_context6.t0, _context6.t1, _context6.t2);

            case 6:
            case "end":
              return _context6.stop();
          }
        }
      });
    });
    it('Check mph token', function _callee7() {
      return regeneratorRuntime.async(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              _context7.t0 = assert;
              _context7.next = 3;
              return regeneratorRuntime.awrap(daiLpPool.mph());

            case 3:
              _context7.t1 = _context7.sent;
              _context7.t2 = config.mph;

              _context7.t0.equal.call(_context7.t0, _context7.t1, _context7.t2);

            case 6:
            case "end":
              return _context7.stop();
          }
        }
      });
    });
    it('Policy should be policy contract', function _callee8() {
      return regeneratorRuntime.async(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              _context8.t0 = assert;
              _context8.next = 3;
              return regeneratorRuntime.awrap(daiLpPool.policy());

            case 3:
              _context8.t1 = _context8.sent;
              _context8.t2 = config.policy;

              _context8.t0.equal.call(_context8.t0, _context8.t1, _context8.t2);

            case 6:
            case "end":
              return _context8.stop();
          }
        }
      });
    });
    it('Max deposit limit should be zero', function _callee9() {
      return regeneratorRuntime.async(function _callee9$(_context9) {
        while (1) {
          switch (_context9.prev = _context9.next) {
            case 0:
              _context9.t0 = assert;
              _context9.next = 3;
              return regeneratorRuntime.awrap(daiLpPool.maxDepositLimit());

            case 3:
              _context9.t1 = _context9.sent;

              _context9.t0.equal.call(_context9.t0, _context9.t1, 0);

            case 5:
            case "end":
              return _context9.stop();
          }
        }
      });
    });
    it('Total lp limit should be zero', function _callee10() {
      return regeneratorRuntime.async(function _callee10$(_context10) {
        while (1) {
          switch (_context10.prev = _context10.next) {
            case 0:
              _context10.t0 = assert;
              _context10.next = 3;
              return regeneratorRuntime.awrap(daiLpPool.totalLpLimit());

            case 3:
              _context10.t1 = _context10.sent;

              _context10.t0.equal.call(_context10.t0, _context10.t1, 0);

            case 5:
            case "end":
              return _context10.stop();
          }
        }
      });
    });
    it('Check lock period', function _callee11() {
      return regeneratorRuntime.async(function _callee11$(_context11) {
        while (1) {
          switch (_context11.prev = _context11.next) {
            case 0:
              _context11.t0 = assert;
              _context11.next = 3;
              return regeneratorRuntime.awrap(daiLpPool.lockPeriod());

            case 3:
              _context11.t1 = _context11.sent.toString();
              _context11.t2 = config.lockPeriod.toString();

              _context11.t0.equal.call(_context11.t0, _context11.t1, _context11.t2);

            case 6:
            case "end":
              return _context11.stop();
          }
        }
      });
    });
    it('TotalLpLimitEnabled should be false', function _callee12() {
      return regeneratorRuntime.async(function _callee12$(_context12) {
        while (1) {
          switch (_context12.prev = _context12.next) {
            case 0:
              _context12.t0 = assert;
              _context12.next = 3;
              return regeneratorRuntime.awrap(daiLpPool.totalLpLimitEnabled());

            case 3:
              _context12.t1 = _context12.sent;

              _context12.t0.equal.call(_context12.t0, _context12.t1, false);

            case 5:
            case "end":
              return _context12.stop();
          }
        }
      });
    });
    it('MaxDepositLimitEnabled should be false', function _callee13() {
      return regeneratorRuntime.async(function _callee13$(_context13) {
        while (1) {
          switch (_context13.prev = _context13.next) {
            case 0:
              _context13.t0 = assert;
              _context13.next = 3;
              return regeneratorRuntime.awrap(daiLpPool.maxDepositLimitEnabled());

            case 3:
              _context13.t1 = _context13.sent;

              _context13.t0.equal.call(_context13.t0, _context13.t1, false);

            case 5:
            case "end":
              return _context13.stop();
          }
        }
      });
    });
    it('TotalLpLocked should be zero', function _callee14() {
      return regeneratorRuntime.async(function _callee14$(_context14) {
        while (1) {
          switch (_context14.prev = _context14.next) {
            case 0:
              _context14.t0 = assert;
              _context14.next = 3;
              return regeneratorRuntime.awrap(daiLpPool.totalLpLocked());

            case 3:
              _context14.t1 = _context14.sent;

              _context14.t0.equal.call(_context14.t0, _context14.t1, 0);

            case 5:
            case "end":
              return _context14.stop();
          }
        }
      });
    });
    it('DepositLength should be zero', function _callee15() {
      return regeneratorRuntime.async(function _callee15$(_context15) {
        while (1) {
          switch (_context15.prev = _context15.next) {
            case 0:
              _context15.t0 = assert;
              _context15.next = 3;
              return regeneratorRuntime.awrap(daiLpPool.depositLength());

            case 3:
              _context15.t1 = _context15.sent;

              _context15.t0.equal.call(_context15.t0, _context15.t1, 0);

            case 5:
            case "end":
              return _context15.stop();
          }
        }
      });
    });
    it('Check tresury', function _callee16() {
      return regeneratorRuntime.async(function _callee16$(_context16) {
        while (1) {
          switch (_context16.prev = _context16.next) {
            case 0:
              _context16.t0 = assert;
              _context16.next = 3;
              return regeneratorRuntime.awrap(daiLpPool.treasury());

            case 3:
              _context16.t1 = _context16.sent.toString();
              _context16.t2 = treasury;

              _context16.t0.equal.call(_context16.t0, _context16.t1, _context16.t2);

            case 6:
            case "end":
              return _context16.stop();
          }
        }
      });
    });
    it('Check periodFinish', function _callee17() {
      return regeneratorRuntime.async(function _callee17$(_context17) {
        while (1) {
          switch (_context17.prev = _context17.next) {
            case 0:
              _context17.t0 = assert;
              _context17.next = 3;
              return regeneratorRuntime.awrap(daiLpPool.periodFinish());

            case 3:
              _context17.t1 = _context17.sent;

              _context17.t0.equal.call(_context17.t0, _context17.t1, 0);

            case 5:
            case "end":
              return _context17.stop();
          }
        }
      });
    });
    it('Check debaseRewardRate', function _callee18() {
      return regeneratorRuntime.async(function _callee18$(_context18) {
        while (1) {
          switch (_context18.prev = _context18.next) {
            case 0:
              _context18.t0 = assert;
              _context18.next = 3;
              return regeneratorRuntime.awrap(daiLpPool.debaseRewardRate());

            case 3:
              _context18.t1 = _context18.sent;

              _context18.t0.equal.call(_context18.t0, _context18.t1, 0);

            case 5:
            case "end":
              return _context18.stop();
          }
        }
      });
    });
    it('Check lastUpdateBlock', function _callee19() {
      return regeneratorRuntime.async(function _callee19$(_context19) {
        while (1) {
          switch (_context19.prev = _context19.next) {
            case 0:
              _context19.t0 = assert;
              _context19.next = 3;
              return regeneratorRuntime.awrap(daiLpPool.lastUpdateBlock());

            case 3:
              _context19.t1 = _context19.sent;

              _context19.t0.equal.call(_context19.t0, _context19.t1, 0);

            case 5:
            case "end":
              return _context19.stop();
          }
        }
      });
    });
    it('Check debaseRewardPerTokenStored', function _callee20() {
      return regeneratorRuntime.async(function _callee20$(_context20) {
        while (1) {
          switch (_context20.prev = _context20.next) {
            case 0:
              _context20.t0 = assert;
              _context20.next = 3;
              return regeneratorRuntime.awrap(daiLpPool.debaseRewardPerTokenStored());

            case 3:
              _context20.t1 = _context20.sent;

              _context20.t0.equal.call(_context20.t0, _context20.t1, 0);

            case 5:
            case "end":
              return _context20.stop();
          }
        }
      });
    });
    it('Check debaseRewardPercentage', function _callee21() {
      return regeneratorRuntime.async(function _callee21$(_context21) {
        while (1) {
          switch (_context21.prev = _context21.next) {
            case 0:
              _context21.t0 = assert;
              _context21.next = 3;
              return regeneratorRuntime.awrap(daiLpPool.debaseRewardPercentage());

            case 3:
              _context21.t1 = _context21.sent;
              _context21.t2 = config.debaseRewardPercentage;

              _context21.t0.equal.call(_context21.t0, _context21.t1, _context21.t2);

            case 6:
            case "end":
              return _context21.stop();
          }
        }
      });
    });
    it('Check debaseRewardDistributed', function _callee22() {
      return regeneratorRuntime.async(function _callee22$(_context22) {
        while (1) {
          switch (_context22.prev = _context22.next) {
            case 0:
              _context22.t0 = assert;
              _context22.next = 3;
              return regeneratorRuntime.awrap(daiLpPool.debaseRewardDistributed());

            case 3:
              _context22.t1 = _context22.sent;

              _context22.t0.equal.call(_context22.t0, _context22.t1, 0);

            case 5:
            case "end":
              return _context22.stop();
          }
        }
      });
    });
    it('Check blockDuration', function _callee23() {
      return regeneratorRuntime.async(function _callee23$(_context23) {
        while (1) {
          switch (_context23.prev = _context23.next) {
            case 0:
              _context23.t0 = assert;
              _context23.next = 3;
              return regeneratorRuntime.awrap(daiLpPool.blockDuration());

            case 3:
              _context23.t1 = _context23.sent;
              _context23.t2 = config.blockDuration;

              _context23.t0.equal.call(_context23.t0, _context23.t1, _context23.t2);

            case 6:
            case "end":
              return _context23.stop();
          }
        }
      });
    });
    it('Check poolEnabled', function _callee24() {
      return regeneratorRuntime.async(function _callee24$(_context24) {
        while (1) {
          switch (_context24.prev = _context24.next) {
            case 0:
              _context24.t0 = assert;
              _context24.next = 3;
              return regeneratorRuntime.awrap(daiLpPool.poolEnabled());

            case 3:
              _context24.t1 = _context24.sent;

              _context24.t0.equal.call(_context24.t0, _context24.t1, false);

            case 5:
            case "end":
              return _context24.stop();
          }
        }
      });
    });
    it('Check mphTakeBackMultiplier', function _callee25() {
      return regeneratorRuntime.async(function _callee25$(_context25) {
        while (1) {
          switch (_context25.prev = _context25.next) {
            case 0:
              _context25.t0 = assert;
              _context25.next = 3;
              return regeneratorRuntime.awrap(daiLpPool.mphTakeBackMultiplier());

            case 3:
              _context25.t1 = _context25.sent.toString();

              _context25.t0.equal.call(_context25.t0, _context25.t1, "300000000000000000");

            case 5:
            case "end":
              return _context25.stop();
          }
        }
      });
    });
  });
  describe('setters check', function () {
    it('check setRewardPercentage', function _callee26() {
      return regeneratorRuntime.async(function _callee26$(_context26) {
        while (1) {
          switch (_context26.prev = _context26.next) {
            case 0:
              _context26.next = 2;
              return regeneratorRuntime.awrap(expectRevert(daiLpPool.setRewardPercentage(10, {
                from: accounts[2]
              }), 'Ownable: caller is not the owner'));

            case 2:
              _context26.next = 4;
              return regeneratorRuntime.awrap(daiLpPool.setRewardPercentage(10, {
                from: accounts[0]
              }));

            case 4:
              _context26.t0 = assert;
              _context26.next = 7;
              return regeneratorRuntime.awrap(daiLpPool.debaseRewardPercentage());

            case 7:
              _context26.t1 = _context26.sent;

              _context26.t0.equal.call(_context26.t0, _context26.t1, 10);

            case 9:
            case "end":
              return _context26.stop();
          }
        }
      });
    });
    it('check setBlockDuration', function _callee27() {
      return regeneratorRuntime.async(function _callee27$(_context27) {
        while (1) {
          switch (_context27.prev = _context27.next) {
            case 0:
              _context27.next = 2;
              return regeneratorRuntime.awrap(expectRevert(daiLpPool.setBlockDuration(10, {
                from: accounts[2]
              }), 'Ownable: caller is not the owner'));

            case 2:
              _context27.next = 4;
              return regeneratorRuntime.awrap(expectRevert(daiLpPool.setBlockDuration(0, {
                from: accounts[0]
              }), 'invalid duration'));

            case 4:
              _context27.next = 6;
              return regeneratorRuntime.awrap(daiLpPool.setBlockDuration(10, {
                from: accounts[0]
              }));

            case 6:
              _context27.t0 = assert;
              _context27.next = 9;
              return regeneratorRuntime.awrap(daiLpPool.blockDuration());

            case 9:
              _context27.t1 = _context27.sent;

              _context27.t0.equal.call(_context27.t0, _context27.t1, 10);

            case 11:
            case "end":
              return _context27.stop();
          }
        }
      });
    });
    it('check setPoolEnabled', function _callee28() {
      return regeneratorRuntime.async(function _callee28$(_context28) {
        while (1) {
          switch (_context28.prev = _context28.next) {
            case 0:
              _context28.next = 2;
              return regeneratorRuntime.awrap(expectRevert(daiLpPool.setPoolEnabled(true, {
                from: accounts[2]
              }), 'Ownable: caller is not the owner'));

            case 2:
              _context28.next = 4;
              return regeneratorRuntime.awrap(daiLpPool.setPoolEnabled(true, {
                from: accounts[0]
              }));

            case 4:
              _context28.t0 = assert;
              _context28.next = 7;
              return regeneratorRuntime.awrap(daiLpPool.poolEnabled());

            case 7:
              _context28.t1 = _context28.sent;

              _context28.t0.equal.call(_context28.t0, _context28.t1, true);

              _context28.next = 11;
              return regeneratorRuntime.awrap(daiLpPool.setPoolEnabled(false, {
                from: accounts[0]
              }));

            case 11:
              _context28.t2 = assert;
              _context28.next = 14;
              return regeneratorRuntime.awrap(daiLpPool.poolEnabled());

            case 14:
              _context28.t3 = _context28.sent;

              _context28.t2.equal.call(_context28.t2, _context28.t3, false);

            case 16:
            case "end":
              return _context28.stop();
          }
        }
      });
    });
    it('check setDaiFee', function _callee29() {
      return regeneratorRuntime.async(function _callee29$(_context29) {
        while (1) {
          switch (_context29.prev = _context29.next) {
            case 0:
              _context29.next = 2;
              return regeneratorRuntime.awrap(expectRevert(daiLpPool.setDaiFee(10, {
                from: accounts[2]
              }), 'Ownable: caller is not the owner'));

            case 2:
              _context29.next = 4;
              return regeneratorRuntime.awrap(daiLpPool.setDaiFee(10, {
                from: accounts[0]
              }));

            case 4:
              _context29.t0 = assert;
              _context29.next = 7;
              return regeneratorRuntime.awrap(daiLpPool.daiFee());

            case 7:
              _context29.t1 = _context29.sent;

              _context29.t0.equal.call(_context29.t0, _context29.t1, 10);

            case 9:
            case "end":
              return _context29.stop();
          }
        }
      });
    });
    it('check setMphFee', function _callee30() {
      return regeneratorRuntime.async(function _callee30$(_context30) {
        while (1) {
          switch (_context30.prev = _context30.next) {
            case 0:
              _context30.next = 2;
              return regeneratorRuntime.awrap(expectRevert(daiLpPool.setMphFee(10, {
                from: accounts[2]
              }), 'Ownable: caller is not the owner'));

            case 2:
              _context30.next = 4;
              return regeneratorRuntime.awrap(daiLpPool.setMphFee(10, {
                from: accounts[0]
              }));

            case 4:
              _context30.t0 = assert;
              _context30.next = 7;
              return regeneratorRuntime.awrap(daiLpPool.mphFee());

            case 7:
              _context30.t1 = _context30.sent;

              _context30.t0.equal.call(_context30.t0, _context30.t1, 10);

            case 9:
            case "end":
              return _context30.stop();
          }
        }
      });
    });
    it('check setTreasury', function _callee31() {
      return regeneratorRuntime.async(function _callee31$(_context31) {
        while (1) {
          switch (_context31.prev = _context31.next) {
            case 0:
              _context31.next = 2;
              return regeneratorRuntime.awrap(expectRevert(daiLpPool.setTreasury(accounts[1], {
                from: accounts[2]
              }), 'Ownable: caller is not the owner'));

            case 2:
              _context31.next = 4;
              return regeneratorRuntime.awrap(expectRevert(daiLpPool.setTreasury("0x0000000000000000000000000000000000000000", {
                from: accounts[0]
              }), 'Invalid addr'));

            case 4:
              _context31.next = 6;
              return regeneratorRuntime.awrap(daiLpPool.setTreasury(accounts[1], {
                from: accounts[0]
              }));

            case 6:
              _context31.t0 = assert;
              _context31.next = 9;
              return regeneratorRuntime.awrap(daiLpPool.treasury());

            case 9:
              _context31.t1 = _context31.sent;
              _context31.t2 = accounts[1];

              _context31.t0.equal.call(_context31.t0, _context31.t1, _context31.t2);

            case 12:
            case "end":
              return _context31.stop();
          }
        }
      });
    });
    it('check setPolicy', function _callee32() {
      return regeneratorRuntime.async(function _callee32$(_context32) {
        while (1) {
          switch (_context32.prev = _context32.next) {
            case 0:
              _context32.next = 2;
              return regeneratorRuntime.awrap(expectRevert(daiLpPool.setPolicy(accounts[1], {
                from: accounts[2]
              }), 'Ownable: caller is not the owner'));

            case 2:
              _context32.next = 4;
              return regeneratorRuntime.awrap(expectRevert(daiLpPool.setPolicy("0x0000000000000000000000000000000000000000", {
                from: accounts[0]
              }), 'Invalid addr'));

            case 4:
              _context32.next = 6;
              return regeneratorRuntime.awrap(daiLpPool.setPolicy(accounts[1], {
                from: accounts[0]
              }));

            case 6:
              _context32.t0 = assert;
              _context32.next = 9;
              return regeneratorRuntime.awrap(daiLpPool.policy());

            case 9:
              _context32.t1 = _context32.sent;
              _context32.t2 = accounts[1];

              _context32.t0.equal.call(_context32.t0, _context32.t1, _context32.t2);

            case 12:
            case "end":
              return _context32.stop();
          }
        }
      });
    });
    it('check setMaxDepositLimit', function _callee33() {
      return regeneratorRuntime.async(function _callee33$(_context33) {
        while (1) {
          switch (_context33.prev = _context33.next) {
            case 0:
              _context33.next = 2;
              return regeneratorRuntime.awrap(expectRevert(daiLpPool.setMaxDepositLimit(10, {
                from: accounts[2]
              }), 'Ownable: caller is not the owner'));

            case 2:
              _context33.next = 4;
              return regeneratorRuntime.awrap(daiLpPool.setMaxDepositLimit(10, {
                from: accounts[0]
              }));

            case 4:
              _context33.t0 = assert;
              _context33.next = 7;
              return regeneratorRuntime.awrap(daiLpPool.maxDepositLimit());

            case 7:
              _context33.t1 = _context33.sent;

              _context33.t0.equal.call(_context33.t0, _context33.t1, 10);

            case 9:
            case "end":
              return _context33.stop();
          }
        }
      });
    });
    it('check setMaxDepositLimitEnabled', function _callee34() {
      return regeneratorRuntime.async(function _callee34$(_context34) {
        while (1) {
          switch (_context34.prev = _context34.next) {
            case 0:
              _context34.next = 2;
              return regeneratorRuntime.awrap(expectRevert(daiLpPool.setMaxDepositLimitEnabled(true, {
                from: accounts[2]
              }), 'Ownable: caller is not the owner'));

            case 2:
              _context34.next = 4;
              return regeneratorRuntime.awrap(daiLpPool.setMaxDepositLimitEnabled(true, {
                from: accounts[0]
              }));

            case 4:
              _context34.t0 = assert;
              _context34.next = 7;
              return regeneratorRuntime.awrap(daiLpPool.maxDepositLimitEnabled());

            case 7:
              _context34.t1 = _context34.sent;

              _context34.t0.equal.call(_context34.t0, _context34.t1, true);

              _context34.next = 11;
              return regeneratorRuntime.awrap(daiLpPool.setMaxDepositLimitEnabled(false, {
                from: accounts[0]
              }));

            case 11:
              _context34.t2 = assert;
              _context34.next = 14;
              return regeneratorRuntime.awrap(daiLpPool.maxDepositLimitEnabled());

            case 14:
              _context34.t3 = _context34.sent;

              _context34.t2.equal.call(_context34.t2, _context34.t3, false);

            case 16:
            case "end":
              return _context34.stop();
          }
        }
      });
    });
    it('check setTotalLpLimit', function _callee35() {
      return regeneratorRuntime.async(function _callee35$(_context35) {
        while (1) {
          switch (_context35.prev = _context35.next) {
            case 0:
              _context35.next = 2;
              return regeneratorRuntime.awrap(expectRevert(daiLpPool.setTotalLpLimit(10, {
                from: accounts[2]
              }), 'Ownable: caller is not the owner'));

            case 2:
              _context35.next = 4;
              return regeneratorRuntime.awrap(daiLpPool.setTotalLpLimit(10, {
                from: accounts[0]
              }));

            case 4:
              _context35.t0 = assert;
              _context35.next = 7;
              return regeneratorRuntime.awrap(daiLpPool.totalLpLimit());

            case 7:
              _context35.t1 = _context35.sent;

              _context35.t0.equal.call(_context35.t0, _context35.t1, 10);

            case 9:
            case "end":
              return _context35.stop();
          }
        }
      });
    });
    it('check setTotalLpLimitEnabled', function _callee36() {
      return regeneratorRuntime.async(function _callee36$(_context36) {
        while (1) {
          switch (_context36.prev = _context36.next) {
            case 0:
              _context36.next = 2;
              return regeneratorRuntime.awrap(expectRevert(daiLpPool.setTotalLpLimitEnabled(true, {
                from: accounts[2]
              }), 'Ownable: caller is not the owner'));

            case 2:
              _context36.next = 4;
              return regeneratorRuntime.awrap(daiLpPool.setTotalLpLimitEnabled(true, {
                from: accounts[0]
              }));

            case 4:
              _context36.t0 = assert;
              _context36.next = 7;
              return regeneratorRuntime.awrap(daiLpPool.totalLpLimitEnabled());

            case 7:
              _context36.t1 = _context36.sent;

              _context36.t0.equal.call(_context36.t0, _context36.t1, true);

              _context36.next = 11;
              return regeneratorRuntime.awrap(daiLpPool.setTotalLpLimitEnabled(false, {
                from: accounts[0]
              }));

            case 11:
              _context36.t2 = assert;
              _context36.next = 14;
              return regeneratorRuntime.awrap(daiLpPool.totalLpLimitEnabled());

            case 14:
              _context36.t3 = _context36.sent;

              _context36.t2.equal.call(_context36.t2, _context36.t3, false);

            case 16:
            case "end":
              return _context36.stop();
          }
        }
      });
    });
    it('check setMaxDepositLimit', function _callee37() {
      return regeneratorRuntime.async(function _callee37$(_context37) {
        while (1) {
          switch (_context37.prev = _context37.next) {
            case 0:
              _context37.next = 2;
              return regeneratorRuntime.awrap(expectRevert(daiLpPool.setLockPeriod(10, {
                from: accounts[2]
              }), 'Ownable: caller is not the owner'));

            case 2:
              _context37.next = 4;
              return regeneratorRuntime.awrap(expectRevert(daiLpPool.setLockPeriod(0, {
                from: accounts[0]
              }), 'invalid lock period'));

            case 4:
              _context37.next = 6;
              return regeneratorRuntime.awrap(daiLpPool.setLockPeriod(10, {
                from: accounts[0]
              }));

            case 6:
              _context37.t0 = assert;
              _context37.next = 9;
              return regeneratorRuntime.awrap(daiLpPool.lockPeriod());

            case 9:
              _context37.t1 = _context37.sent;

              _context37.t0.equal.call(_context37.t0, _context37.t1, 10);

            case 11:
            case "end":
              return _context37.stop();
          }
        }
      });
    });
    it('check setMphTakeBackMultiplier', function _callee38() {
      return regeneratorRuntime.async(function _callee38$(_context38) {
        while (1) {
          switch (_context38.prev = _context38.next) {
            case 0:
              _context38.next = 2;
              return regeneratorRuntime.awrap(expectRevert(daiLpPool.setMphTakeBackMultiplier("1000000000000000000", {
                from: accounts[2]
              }), 'Ownable: caller is not the owner'));

            case 2:
              _context38.next = 4;
              return regeneratorRuntime.awrap(daiLpPool.setMphTakeBackMultiplier("1000000000000000000", {
                from: accounts[0]
              }));

            case 4:
              _context38.t0 = assert;
              _context38.next = 7;
              return regeneratorRuntime.awrap(daiLpPool.mphTakeBackMultiplier());

            case 7:
              _context38.t1 = _context38.sent.toString();

              _context38.t0.equal.call(_context38.t0, _context38.t1, "1000000000000000000");

            case 9:
            case "end":
              return _context38.stop();
          }
        }
      });
    });
  });
});