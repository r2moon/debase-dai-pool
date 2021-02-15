"use strict";

var DaiLpPool = artifacts.require("DaiLpPoolV2");

var config = require("../config.json");

module.exports = function _callee(deployer) {
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          deployer.deploy(DaiLpPool, config.debaseDaiPair, config.dai, config.debase, config.mph, config.policy, config.daiFixedPool, config.mphVesting, config.lockPeriod, config.treasury, config.debaseRewardPercentage, config.blockDuration);

        case 1:
        case "end":
          return _context.stop();
      }
    }
  });
};