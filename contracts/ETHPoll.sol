//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract ETHPool {

    struct User {
        uint256 deposit_amount;
        uint256 index;
        bool initialized;
    }

    mapping(address => User) public addressToUser;
    address[] public users;

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function deposit() payable public {
        User memory user =  addressToUser[msg.sender];
        uint256 index = user.index;
        bool initialized = user.initialized;
        if ( !initialized ) {
            initialized = true;
            index = users.length;
            users.push(msg.sender);
        }
        user = User(user.deposit_amount + msg.value, index, initialized);
        addressToUser[msg.sender] = user;
    }

    function deposit_rewards() payable public {
        require(msg.sender == owner, "You must be owner");

        for (
            uint256 index = 0;
            index < users.length;
            index++
        ) {
            address adrs = users[index];
            User memory user = addressToUser[adrs];
            user.deposit_amount += calculate_rewards(user.deposit_amount, msg.value);
            addressToUser[adrs] = user;
        }

    }

    function calculate_rewards(uint256 user_deposit_amount, uint256 rewards) view private returns (uint256) {
        return user_deposit_amount * rewards / (address(this).balance - rewards);
    }

    function withdraw() public {
        User memory user = addressToUser[msg.sender];
        payable(msg.sender).transfer(user.deposit_amount);
        deleteUser(msg.sender, user.index);
    }

    function deleteUser(address adrs, uint256 _index) private {
        address adrs_aux = users[users.length - 1];
        users[_index] = adrs_aux;
        users.pop();
        
        User memory user = addressToUser[adrs_aux];
        user.index = _index;
        addressToUser[adrs_aux] = user;
        delete addressToUser[adrs];
    }
}
