const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ETHPool", function () {
  let contract, accounts, owner, account_A, account_B;
  const getEth = ethers.utils.parseEther;
  const getBalance = ethers.provider.getBalance;
  const oneEth = getEth("1");
  const twoEth = getEth("2");

  function fEth(num) {
    let res = ethers.utils.formatEther(num);
    res = (+res).toFixed(2);
    return res;
}

  beforeEach(async () => { 
    const ETHPool = await ethers.getContractFactory("ETHPool");
    contract = await ETHPool.deploy();
    await contract.deployed();

    accounts = await ethers.getSigners();
    owner = accounts[0];
    account_A = accounts[1];
    account_B = accounts[2];
  })

  it("Should return the owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
  });

  it("One user deposit", async function () {

    await contract.connect(account_A).deposit({ value:oneEth});
    expect(await getBalance(contract.address)).to.equal(oneEth); 
    let user = await contract.addressToUser(account_A.address);
    expect(user.deposit_amount).to.equal(oneEth);
  });

  it("Many users deposit", async function () {
    const expected_balance = ethers.utils.parseEther((accounts.length).toString());

    for (account of accounts) {
      await contract.connect(account).deposit({ value:oneEth});
    }
    expect(await getBalance(contract.address)).to.equal(expected_balance);
    for (account of accounts) {
      let user = await contract.addressToUser(account.address);
      expect(user.deposit_amount).to.equal(oneEth);
    }
  });

  it("Rewards with one user deposited", async function () {

    await contract.connect(account_A).deposit({ value:oneEth});
    await contract.deposit_rewards({ value:oneEth});

    expect(await getBalance(contract.address)).to.equal(twoEth); 
    let user = await contract.addressToUser(account_A.address);

    expect(user.deposit_amount).to.equal(twoEth);
  });

  it("Rewards with two users deposited", async function () {
    await contract.connect(account_A).deposit({ value:getEth("100")});
    await contract.connect(account_B).deposit({ value:getEth("300")});
    
    expect(await getBalance(contract.address)).to.equal(getEth("400"));

    await contract.deposit_rewards({ value:getEth("200")});

    let userA = await contract.addressToUser(account_A.address);
    expect(userA.deposit_amount).to.equal(getEth("150"));

    let userB = await contract.addressToUser(account_B.address);
    expect(userB.deposit_amount).to.equal(getEth("450"));

  });

  it("Two Rewards with two users deposited", async function () {
    await contract.connect(account_A).deposit({ value:getEth("100")});
    await contract.connect(account_B).deposit({ value:getEth("300")});

    await contract.deposit_rewards({ value:getEth("100")});
    await contract.deposit_rewards({ value:getEth("100")});

    expect(await getBalance(contract.address)).to.equal(getEth("600")); 

    let userA = await contract.addressToUser(account_A.address);
    expect(userA.deposit_amount).to.equal(getEth("150"));


    let userB = await contract.addressToUser(account_B.address);
    expect(userB.deposit_amount).to.equal(getEth("450"));

  });

  it("users deposit, rewards deposit, then other user deposit ", async function () {
    await contract.connect(account_A).deposit({ value:getEth("100")});
    await contract.deposit_rewards({ value:getEth("100")});

    await contract.connect(account_B).deposit({ value:getEth("300")});
  
    expect(await getBalance(contract.address)).to.equal(getEth("500")); 

    let userA = await contract.addressToUser(account_A.address);
    expect(userA.deposit_amount).to.equal(getEth("200"));

    let userB = await contract.addressToUser(account_B.address);
    expect(userB.deposit_amount).to.equal(getEth("300"));

  });

  it("users deposit, rewards deposit, then other user deposit, then rewards deposit", async function () {
    await contract.connect(account_A).deposit({ value:getEth("100")});
    await contract.deposit_rewards({ value:getEth("100")});

    await contract.connect(account_B).deposit({ value:getEth("200")});
  
    await contract.deposit_rewards({ value:getEth("100")});

    expect(await getBalance(contract.address)).to.equal(getEth("500")); 
    let userA = await contract.addressToUser(account_A.address);
    expect(userA.deposit_amount).to.equal(getEth("250"));

    let userB = await contract.addressToUser(account_B.address);
    expect(userB.deposit_amount).to.equal(getEth("250"));

  });

  it("Withdraw with one user deposited", async function () {

    await contract.connect(account_A).deposit({ value:oneEth});
    await contract.connect(account_A).withdraw();

    expect(await getBalance(contract.address)).to.equal(0);
    let userA = await contract.addressToUser(account_A.address);

    expect(userA.deposit_amount).to.equal(0);
  });

  it("withdraw with one Rewards and two users deposited", async function () {
    await contract.connect(account_A).deposit({ value:getEth("100")});
    await contract.connect(account_B).deposit({ value:getEth("300")});
    await contract.deposit_rewards({ value:getEth("100")});

    await contract.connect(account_A).withdraw();

    expect(await getBalance(contract.address)).to.equal(getEth("375")); 
    let userA = await contract.addressToUser(account_A.address);
    expect(userA.deposit_amount).to.equal(0);

    let userB = await contract.addressToUser(account_B.address);
    expect(userB.deposit_amount).to.equal(getEth("375"));
  });

  it("withdraw with one Rewards and two users deposited", async function () {
    await contract.connect(account_A).deposit({ value:getEth("100")});
    await contract.deposit_rewards({ value:getEth("100")});

    await contract.connect(account_B).deposit({ value:getEth("300")});
    await contract.connect(account_A).withdraw();

    expect(await getBalance(contract.address)).to.equal(getEth("300")); 
    let userA = await contract.addressToUser(account_A.address);
    expect(userA.deposit_amount).to.equal(0);

    let userB = await contract.addressToUser(account_B.address);
    expect(userB.deposit_amount).to.equal(getEth("300"));
  });

  it("two withdraw with one Rewards", async function () {
    let init_value = await getBalance(account_A.address);
    await contract.connect(account_A).deposit({ value:getEth("500")});
    await contract.deposit_rewards({ value:getEth("1000")});

    await contract.connect(account_B).deposit({ value:getEth("3000")});
    await contract.connect(account_A).withdraw();
    await contract.connect(account_B).withdraw();

    expect(await getBalance(contract.address)).to.equal(0);
    let userA = await contract.addressToUser(account_A.address);
    expect(userA.deposit_amount).to.equal(0);

    let userB = await contract.addressToUser(account_B.address);
    expect(userB.deposit_amount).to.equal(0);

    let new_balance = fEth(await getBalance(account_A.address))
    expect( new_balance ).to.equal( fEth(init_value.add(getEth("1000"))) );
  });

  it("all user deposit", async function () {
    let init_value = await getBalance(account_A.address);
    for( account of accounts)
      await contract.connect(account).deposit({ value:oneEth});
    await contract.deposit_rewards({ value:getEth("20")});

    let userA = await contract.addressToUser(account_A.address);
    expect(userA.deposit_amount).to.equal(twoEth);

    await contract.connect(account_A).withdraw();

    expect(await getBalance(contract.address)).to.equal(getEth("38"));

    userA = await contract.addressToUser(account_A.address);
    expect(userA.deposit_amount).to.equal(0);
    let new_balance = fEth(await getBalance(account_A.address))
    expect( new_balance ).to.equal( fEth(init_value.add(oneEth)) );
  });

  it("all user deposit and rewards", async function () {
    for( account of accounts){
      await contract.connect(account).deposit({ value:oneEth});
    }
    await contract.deposit_rewards({ value:getEth("20")});

    for( account of accounts) {
      let user = await contract.addressToUser(account.address);
      expect(user.deposit_amount).to.equal(twoEth);

      await contract.connect(account).withdraw();

      user = await contract.addressToUser(account.address);
      expect(user.deposit_amount).to.equal(0);
    }

    expect(await getBalance(contract.address)).to.equal(0);
  });

  it("One user deposit many times", async function () {

    await contract.connect(account_A).deposit({ value:oneEth});
    await contract.connect(account_A).deposit({ value:oneEth});
    await contract.connect(account_B).deposit({ value:oneEth});

    let userA = await contract.addressToUser(account_A.address);
    expect(userA.index).to.equal(0);
    expect(userA.deposit_amount).to.equal(twoEth);

    let userB = await contract.addressToUser(account_B.address);
    expect(userB.index).to.equal(1);
  });

  it("all deposit and one witdraw", async function () {

    for (account of accounts) {
      await contract.connect(account).deposit({ value:oneEth});
    }
    let last_user = await contract.users(accounts.length-1);
    let userB = await contract.addressToUser(account_B.address);
    let index = userB.index;

    await contract.connect(account_B).withdraw();
    expect(last_user).to.equal(await contract.users(index));
  });

  it("All deposit, all withdraw, and all deposit", async function () {

    for (account of accounts) {
      await contract.connect(account).deposit({ value:oneEth});
    }

    for (account of accounts) {
      await contract.connect(account).withdraw();
    }

    for (account of accounts) {
      await contract.connect(account).deposit({ value:oneEth});
    }
    for (account of accounts) {
      await contract.connect(account).withdraw();
    }
    expect(await getBalance(contract.address)).to.equal(0);
  });


});
