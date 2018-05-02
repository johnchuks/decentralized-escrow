var Escrow  = artifacts.require('../contracts/escrow.sol');

contract ('Escrow', function(accounts){
  var escrowInstance;

  it ('should create and award a contract', function (){
    return Escrow.deployed().then((instance) => {
      escrowInstance = instance;
      return escrowInstance.createContract.call(accounts[3], 'Debug on VSCode', 100, { from: accounts[3] });
    }).then(assert.fail).catch((error) => {
      assert(error.message.indexOf('revert') >= 0, 'Awarder cannot award its address the contract');
      return escrowInstance.createContract.call(accounts[2], 'Debug on VScode', 1000000000000000000000000000, { from: accounts[1] });
    }).then(assert.fail).catch((error) => {
      assert(error.message.indexOf('revert') >= 0, 'cannot award contract if both parties don`t have sufficient balance');
      return escrowInstance.createContract(accounts[2], 'Fix bug on react', 1, { from : accounts[1] });
    }).then((receipt) => {
      assert.equal(receipt.logs.length, 1, 'triggers one event');
      assert.equal(receipt.logs[0].event, 'Awarded', 'should trigger an "Awarded" event');
      assert.equal(receipt.logs[0].args._from, accounts[1], 'logs the contract creator account');
      assert.equal(receipt.logs[0].args._to, accounts[2], 'logs the awardee account');
      assert.equal(receipt.logs[0].args._title, '0x46697820627567206f6e20726561637400000000000000000000000000000000');
      return escrowInstance.createContract.call(accounts[2], 'Fix bug in componentDidMount', 10, { from: accounts [3] }); 
    }).then((success) => {
      assert.equal(success, true);
    });
  });
  it ('should deposit funds to the contract address', function() {
    return Escrow.deployed().then((instance) => {
      escrowInstance = instance;
      var awarder = accounts[4];
      var awardee = accounts[2];
      return escrowInstance.createContract(awardee, 'Fix bug on react component', 1, { from : awarder });
    }).then((receipt) => {
      console.log(receipt);
      return escrowInstance.deposit.call(100, 1, { from: accounts[4] });
    }).then(assert.fail).catch((error) => {
      assert(error.message.indexOf('revert') >= 0, 'Only contract parties are allowed to deposit');
    })
  })
})
