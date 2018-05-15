pragma solidity ^0.4.17;

contract Escrow {
    address admin;
    uint numOfJobs = 0;
    
    struct Job {
        bytes32 title;
        bool isCompleted;
        address owner;
        address executer;
        bool doesExist;
        bool isDepositedOwner;
        bool isDepositedExecuter;
        uint256 budget;
    }
    mapping(address => uint) public balanceOf;
    mapping(uint => Job) public jobs;
    
    event Awarded(address indexed _from, address indexed _to, bytes32 _title);
    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event EscrowCompleted(address indexed _owner, address indexed _executer, uint256 _jobId);
    event JobComplete(address indexed _owner, bytes32 _title);
    event Cancel(address indexed _from, uint256 _jobId);
    
    function Escrow() public {
        admin = msg.sender;
    }
    
    modifier onlyAdmin() {
        require(msg.sender == admin);
        _;
    }
    
    modifier onlyContractParties(uint256 _jobId) {
        require(jobs[_jobId].owner == msg.sender || jobs[_jobId].executer == msg.sender);
        _;
    }
    
    modifier onlyExistingContract (uint256 _id) {
        require(jobs[_id].doesExist == true);
        _;
    }
    
    function add(uint256 a, uint256 b) internal pure returns (uint256 c) {
        c = a + b;
        assert(c >= a);
        return c;
    }
    
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        assert(b <= a);
        return a - b;
    }
    
    function createContract(address _awardee, bytes32 _title, uint256 _contractValue) public returns(bool success) {
        address creator = msg.sender;
        require(_awardee != msg.sender);
        require(_contractValue <= creator.balance && _contractValue <= _awardee.balance);
        uint id = numOfJobs += 1;
        jobs[id] = Job(_title, false, msg.sender, _awardee, true, false, false, _contractValue);
        emit Awarded(msg.sender, _awardee, _title);
        return true;
    }

    function accountBalance(address _owner) public view returns (uint256) {
        return _owner.balance;
    }
    
    function _depositFund(address _spender, uint256 _value) internal {
        balanceOf[this] = add(balanceOf[this], _value);
        balanceOf[_spender] = sub(balanceOf[_spender], _value);
    }

    // Both parties deposit funds before job begins
    function deposit(uint256 _value, uint _jobId) public onlyContractParties
    (_jobId) onlyExistingContract(_jobId) returns (bool) {
        address spender = msg.sender;
        require(_value == jobs[_jobId].budget);
        if(jobs[_jobId].owner == spender) {
            balanceOf[spender] = add(balanceOf[spender], _value);
            sub(spender.balance, _value);
            _depositFund(spender, _value);
            jobs[_jobId].isDepositedOwner = true;
            emit Transfer(spender, this, _value);
        }
        else if (jobs[_jobId].executer == spender) {
            balanceOf[spender] = add(balanceOf[spender], _value);
            sub(spender.balance, _value);
            _depositFund(spender, _value);
            jobs[_jobId].isDepositedExecuter = true;
            emit Transfer(spender, this, _value);
        }
        return true;
    }
    // Escrow job owner confirms job is completed
    function confirmJobCompleted(uint _jobId) public onlyExistingContract(_jobId) returns (bool success) {
        require(msg.sender == jobs[_jobId].owner);
        jobs[_jobId].isCompleted = true;
        emit JobComplete(msg.sender, jobs[_jobId].title);
        return true;
        
    }
    function _completePayment(uint256 _jobId, uint256 _funds) private {
        require(jobs[_jobId].isCompleted == true);
        address executer = jobs[_jobId].executer;
        jobs[_jobId].doesExist = false;
        balanceOf[this] = sub(balanceOf[this], _funds);
        balanceOf[executer] = add(balanceOf[executer], _funds);
    }
    
    function completePayment(uint256 _jobId) public returns (bool success) {
        require(msg.sender == jobs[_jobId].owner);
        uint256 funds = balanceOf[this];
        _completePayment(_jobId, funds);
        emit Transfer(this, jobs[_jobId].executer, funds);
        return true;
    }
    
    function cancelContract(uint256 _jobId) public onlyContractParties(_jobId) 
    onlyExistingContract(_jobId) returns (bool success) {
        bool owner = jobs[_jobId].isDepositedOwner;
        bool executer = jobs[_jobId].isDepositedExecuter;
        if (owner == true && executer == true) {
            uint halvedBalance = balanceOf[this]/2;
            balanceOf[jobs[_jobId].owner] = add(balanceOf[jobs[_jobId].owner],halvedBalance);
            balanceOf[jobs[_jobId].executer] = add(balanceOf[jobs[_jobId].executer],halvedBalance);
            balanceOf[this] = sub(balanceOf[this], balanceOf[this]);
        } else if (owner == true && executer == false) {
            balanceOf[jobs[_jobId].owner] = add(balanceOf[jobs[_jobId].owner],balanceOf[this]);
            balanceOf[this] = sub(balanceOf[this], balanceOf[this]);

        } else if (owner == false && executer == true) {
            balanceOf[jobs[_jobId].executer] = add(balanceOf[jobs[_jobId].executer],balanceOf[this]);
            balanceOf[this] = sub(balanceOf[this], balanceOf[this]);
        }
        jobs[_jobId].doesExist = false;
        emit Cancel(msg.sender, _jobId);
        return true;
    }
    
    function endEscrowTransaction() public onlyAdmin {
        selfdestruct(admin);
    }
}
