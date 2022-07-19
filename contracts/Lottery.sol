pragma solidity ^0.4.17;

contract Lottery {
    address public manager;
    address[] public players;
    function Lottery() public {
        manager = msg.sender; //msg is a global variable that is created when the contract is deployed or new txn occurs and contains details of the sender 
    }
    function enter() public payable {
        require(msg.value > .005 ether); //value is the amount of ether in wei that was sent
        players.push(msg.sender);
    }
    function random() private view returns (uint){
        return uint(keccak256(block.difficulty, now, players)); //block, now is a gloabal variable that  gives information about block difficult and current time
    }
    function pickwinner() public restricted{  //function modifier restricted has been defined
        uint index = random() % players.length;
        players[index].transfer(this.balance); //transfer the entire balance of this contract to the winner
        players = new address[](0); //set initial length of dynamic array as 0 by giving second argument. Important for resentting the array back to factory state.
    }
    modifier restricted(){
        require(msg.sender == manager);
        _; //_ is the placeholder for other codes which is in parent function
    }
    function getPlayers() public view returns(address[]){
        return players;
    }
}