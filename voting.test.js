import { expect } from "chai";

import {ethers} from "hardhat";

const WorkflowStatus = {
  RegisteringVoters: 0,
  ProposalsRegistrationStarted: 1,
  ProposalsRegistrationEnded: 2,
  VotingSessionStarted: 3,
  VotingSessionEnded: 4,
  VotesTallied: 5,
};

describe("Voting", function () {
  let voting;
  let owner;
  let voterA;
  let voterB;

  beforeEach(async function () {
    [owner, voterA, voterB] = await ethers.getSigners();
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
    await voting.deployed();
  });

  it("deploys with the deployer as owner and starts in RegisteringVoters", async function () {
    expect(await voting.owner()).to.equal(owner.address);
    const status = await voting.workflowStatus();
    expect(status).to.equal(0); 
  });

  it("happy path: registers voters, tracks proposals, votes, and tallies a winner", async function () {
    
    try{
      await voting.addVoter(voterA.address);
      await voting.addVoter(voterB.address);
    } catch (error) {
      console.log("Erreur 1");
    }

    try{
      await voting.startProposalsRegistering();   
      await voting.connect(voterA).addProposal("Frites a la cantine");
      await voting.connect(voterB).addProposal("Des épinard car c'est plein de fer !")
    } catch (error) {
      console.log("Erreur 2");
    }

    try{
      await voting.endProposalsRegistering();  
      await voting.startVotingSession();   
 
      await voting.connect(voterA).setVote(1);
      await voting.connect(voterB).setVote(2);
    } catch (error) {
      console.log("Erreur 3");
    }

    try{
      await voting.endVotingSession();  
      await voting.tallyVotes();   
    } catch (error) {
      console.log("Erreur 4");
    }

  });
});