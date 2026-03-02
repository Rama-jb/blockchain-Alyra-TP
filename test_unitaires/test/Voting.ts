import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.connect();

const YOU_ARE_NOT_A_VOTER = "You're not a voter";

describe("Voting contract", function () {
  
  // Fixtures  
  async function deployVoting() {
    const [owner, account2, account3] = await ethers.getSigners();
    const voting = await ethers.deployContract("Voting", [owner.address]);
    await voting.waitForDeployment();
    return { voting, owner, account2, account3 };
  }

  it("should set owner as a registered voter on construction", async function () {
    const { voting, owner } = await networkHelpers.loadFixture(deployVoting);

    // seule le owner est entregistré au moement du déploiement
    const voter = await voting.getVoter(owner.address);
    expect(voter.isRegistered).to.be.true;
    expect(voter.hasVoted).to.be.false;
    expect(voter.votedProposalId).to.equal(0);
    
    expect(await voting.workflowStatus()).to.equal(0);
  });

  it("non‑voter cannot call view getters", async function () {
    const { voting, account2 } = await networkHelpers.loadFixture(deployVoting);
    await expect(voting.connect(account2).getVoter(account2.address)).to.be.revertedWith(YOU_ARE_NOT_A_VOTER);
    await expect(voting.connect(account2).getOneProposal(0)).to.be.revertedWith(YOU_ARE_NOT_A_VOTER);
  });


  describe("addVoter", function () {
    it("allows the owner to register a voter during registration phase", async function () {
      const { voting, owner, account2 } = await networkHelpers.loadFixture(deployVoting);

      await expect(voting.connect(owner).addVoter(account2.address))
        .to.emit(voting, "VoterRegistered")
        .withArgs(account2.address);

      const v = await voting.getVoter(account2.address);
      expect(v.isRegistered).to.be.true;
    });
   
    it("reverts if registration is closed", async function () {
      const { voting, owner, account2 } = await networkHelpers.loadFixture(deployVoting);
      await voting.connect(owner).startProposalsRegistering();
      await expect(voting.connect(owner).addVoter(account2.address)).to.be.revertedWith(
        "Voters registration is not open yet"
      );
    });
  });


  describe("proposal flow", function () {
    it("only owner can start proposals and genesis proposal is added", async function () {
      const { voting, owner } = await networkHelpers.loadFixture(deployVoting);
      await expect(voting.connect(owner).startProposalsRegistering())
        .to.emit(voting, "WorkflowStatusChange")
        .withArgs(0, 1);

      const p = await voting.getOneProposal(0);
      expect(p.description).to.equal("GENESIS");
      expect(await voting.workflowStatus()).to.equal(1);
    });   

    it("registered voters can submit proposals during the proper phase", async function () {
      const { voting, owner, account2 } = await networkHelpers.loadFixture(deployVoting);
      await voting.connect(owner).addVoter(account2.address);
      await voting.connect(owner).startProposalsRegistering();

      await expect(voting.connect(account2).addProposal("ma_proposition"))
        .to.emit(voting, "ProposalRegistered")
        .withArgs(1); // 0 pour le genesis

      const prop = await voting.getOneProposal(1);
      expect(prop.description).to.equal("ma_proposition");
      expect(prop.voteCount).to.equal(0);
    });   

    it("non‑voters cannot add proposals", async function () {
      const { voting, owner, account2 } = await networkHelpers.loadFixture(deployVoting);
      await voting.connect(owner).startProposalsRegistering();
      await expect(voting.connect(account2).addProposal("ma proposition")).to.be.revertedWith(YOU_ARE_NOT_A_VOTER);
    });   
  });

  describe("voting and tallying", function () {
    async function prepareVotingEnvironment() {
      const { voting, owner, account2, account3 } = await deployVoting();
      
      await voting.connect(owner).addVoter(account2.address);
      await voting.connect(owner).addVoter(account3.address);
      
      await voting.connect(owner).startProposalsRegistering();
      
      await voting.connect(account2).addProposal("1-propostion");
      await voting.connect(account3).addProposal("2-proposition");
      
      await voting.connect(owner).endProposalsRegistering();
      
      await voting.connect(owner).startVotingSession();
      return { voting, owner, account2, account3 };
    }

    it("allows a voter to vote for a valid proposal", async function () {
      const { voting, account2 } = await networkHelpers.loadFixture(prepareVotingEnvironment);
      // 1-propostion
      await expect(voting.connect(account2).setVote(1))
        .to.emit(voting, "Voted")
        .withArgs(account2.address, 1);

      const voter = await voting.getVoter(account2.address);
      expect(voter.hasVoted).to.be.true;
      expect(voter.votedProposalId).to.equal(1);
    });

    it("reverts if voting session has not started or is closed", async function () {
      const { voting, account2, owner } = await networkHelpers.loadFixture(deployVoting);      
      await voting.connect(owner).addVoter(account2.address);
      await expect(voting.connect(account2).setVote(0)).to.be.revertedWith("Voting session havent started yet");

      const { voting: v2, owner: o2, account3 } = await prepareVotingEnvironment();
      await v2.connect(account3).setVote(1); // make sure we can vote
      await v2.connect(o2).endVotingSession();
      await expect(v2.connect(account3).setVote(1)).to.be.revertedWith("Voting session havent started yet");
    });

    it("tallies votes and chooses the winner", async function () {
      const { voting, owner, account2, account3 } = await networkHelpers.loadFixture(prepareVotingEnvironment);
      
      await voting.connect(account2).setVote(2);
      await voting.connect(account3).setVote(2);      

      await voting.connect(owner).endVotingSession();
      await expect(voting.connect(owner).tallyVotes())
        .to.emit(voting, "WorkflowStatusChange")
        .withArgs(4, 5);

      expect(await voting.winningProposalID()).to.equal(2);
      expect(await voting.workflowStatus()).to.equal(5);
    });   
  });
});
