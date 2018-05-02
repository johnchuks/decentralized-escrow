var Escrow = artifacts.require('../contracts/escrow.sol');

module.exports = function(deployer) {
  deployer.deploy(Escrow);
};
