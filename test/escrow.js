var Escrow  = artifacts.require('../contracts/escrow.sol');

contract ('Escrow', function(accounts){
  var escrowInstance, admin, awarder, awardee, contractAddress;

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
      return escrowInstance.createContract.call(accounts[2], 'Fix bug in componentDidMount', 10, { from: accounts[3] }); 
    }).then((success) => {
      assert.equal(success, true);
    });
  });
  it ('should deposit funds to the contract address', function () {
    return Escrow.deployed().then((instance) => {
      escrowInstance = instance;
      awarder = accounts[4];
      awardee = accounts[2];
      contractAddress = escrowInstance.address
      return escrowInstance.createContract(awardee, 'Fix bug on react component', 100, { from : awarder });
    }).then((receipt) => {
      return escrowInstance.deposit.call(10, 2, { from: accounts[3] });
    }).then(assert.fail).catch((error) => {
      assert(error.message.indexOf('revert') >= 0, 'Only contract parties are allowed to deposit');
      return escrowInstance.deposit.call(10, 4, { from: awarder });
    }).then(assert.fail).catch((error) => {
      assert(error.message.indexOf('revert') >= 0, 'Cannot deposit funds for a non-existent account');
      return escrowInstance.deposit.call(10, 2, { from: awarder });
    }).then(assert.fail).catch((error) => {
      assert(error.message.indexOf('revert') >= 0, 'spender must deposit the correct budget of the project');
      return escrowInstance.deposit(100, 2, { from: awardee });
    }).then((receipt) => {
      return escrowInstance.balanceOf(escrowInstance.address);
    }).then((balance) => {
      assert.equal(balance.toNumber(), 100, 'new balance of the contract');
      return escrowInstance.balanceOf(awardee);
    }).then((balance) => {
      assert.equal(balance.toNumber(),0, 'updated balance of the spender');
      return escrowInstance.deposit(100, 2, { from: awarder });
    }).then((receipt) => {
      assert.equal(receipt.logs.length, 1, 'triggers one event');
      assert.equal(receipt.logs[0].event, 'Transfer', 'triggers a "Transfer" event');
      assert.equal(receipt.logs[0].args._from, awarder, 'logs the transfer account');
      assert.equal(receipt.logs[0].args._to, contractAddress, 'logs the receiving account');
      assert.equal(receipt.logs[0].args._value, 100, 'logs the amount transferred');
      return escrowInstance.balanceOf(escrowInstance.address);
    }).then((balance) => {
      assert.equal(balance.toNumber(), 200, 'updated balance of the contract');
    });
   });
   it('should be able to confirm an existing job', function() {
     return Escrow.deployed().then((instance) => {
       escrowInstance = instance
       return escrowInstance.confirmJobCompleted(2, { from: awardee });
     }).then(assert.fail).catch((error) => {
      assert(error.message.indexOf('revert') >= 0, 'triggers an error if the owner of the job doesn`t confirm');
      return escrowInstance.confirmJobCompleted(2, { from: awarder });
     }).then((receipt) => {
      assert.equal(receipt.logs.length, 1, 'triggers one event');
      assert.equal(receipt.logs[0].event, 'JobComplete', 'logs the `JobCompleted` event');
      assert.equal(receipt.logs[0].args._owner, awarder, 'logs the owner of the job');
      assert.equal(receipt.logs[0].args._title, '0x46697820627567206f6e20726561637420636f6d706f6e656e74000000000000', 'logs the title of the job completed');
      return escrowInstance.confirmJobCompleted.call(2, { from: awarder });
    }).then((success) => {
      assert.equal(success, true);
    });
  });
  it('Should complete payment after job is completed', function() {
    return Escrow.deployed().then((instance) => {
      escrowInstance = instance;
      return escrowInstance.completePayment.call(2, { from: awardee });
    }).then(assert.fail).catch((error) => {
      assert(error.message.indexOf('revert') >= 0, 'triggers an error if an address other than the owner calls function');
      return escrowInstance.completePayment.call(1, { from: accounts[1] });
    }).then((receipt) => {
      return escrowInstance.jobs(1);
    }).then(assert.fail).catch((error) => {
      assert(error.message.indexOf('revert') >= 0, 'Job has to be completed before payment');
      return escrowInstance.completePayment(2, {from: awarder });
    }).then((receipt) => {
      assert.equal(receipt.logs.length, 1, 'triggers an event');
      assert.equal(receipt.logs[0].event, 'Transfer', 'triggers a `Transfer` event');
      assert.equal(receipt.logs[0].args._from, contractAddress, 'logs the `Transfer` account');
      assert.equal(receipt.logs[0].args._to, awardee, 'logs the receiving account');
      assert.equal(receipt.logs[0].args._value, 200, 'logs the transfer value');
      return escrowInstance.balanceOf(contractAddress);
    }).then((balance) => {
      assert.equal(balance.toNumber(), 0, 'new balance of the contract after payment');
      return escrowInstance.balanceOf(awardee);
    }).then((balance) => {
      assert.equal(balance.toNumber(), 200, 'new balance of the awardee after payment');
    })
  })
});
