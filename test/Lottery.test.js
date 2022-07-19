const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const { interface, bytecode } = require('../compile');

let lottery;
let accounts;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts(); //get list of all accounts ganache have created in web3 instance
    lottery = await new web3.eth.Contract(JSON.parse(interface)) //depploy contract to local test network
        .deploy({ data: bytecode })
        .send({ from: accounts[0], gas: '1000000' });
});

describe('Lottery Contract', () => {
    it('deploys a contract', () => {
        assert.ok(lottery.options.address); //if address exists assert will be true
    });
    it('Allows one account to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether'),
        });
        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })
        assert.equal(accounts[0], players[0]);
        assert.equal(1, players.length);
    });
    it('Allows multiple accounts to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether'),
        });
        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('0.02', 'ether'),
        });
        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei('0.02', 'ether'),
        });
        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })
        assert.equal(accounts[0], players[0]);
        assert.equal(accounts[1], players[1]);
        assert.equal(accounts[2], players[2]);
        assert.equal(3, players.length);
    });
    it('requires a minimum amount of ether to enter', async () => {
        try {
            await lottery.methods.enter().send({
                from: accounts[0],
                value: 0
            });
            assert(false); //failing assert if code runs successfully
        } catch (err) {
            assert(err); //using only assert check for truthiness(true/false value) while assert.ok checks for existance
        }
    });
    it('Only manager can call pickwinnner', async () => {
        try {
            await lottery.methods.pickwinnner().send({
                from: accounts[1]
            });
            assert(false); //failing 
        } catch (err) {
            assert(err);
        }
    });
    it('Sends money to the winner and resets players array', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('2', 'ether')
        });
        const initialBalance = await web3.eth.getBalance(accounts[0]);
        await lottery.methods.pickwinner().send({ from: accounts[0] });
        const finalBalance = await web3.eth.getBalance(accounts[0]);
        const difference = finalBalance - initialBalance;
        assert(difference > web3.utils.toWei('1.8', 'ether')); //the difference will not be exactly 2 ether as we spent some gas cost
    });
    it('Players array has become empty after pickwinner is run', async()=>{
        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })
        assert.equal(players.length, 0)
    });
    it('Contract has zero balance after running', async() => {
        // console.log(lottery);
        const balance = await web3.eth.getBalance(lottery.options.address);
        assert.equal(balance, 0);
    })

})