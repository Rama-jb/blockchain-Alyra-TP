// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";

contract Voting is Ownable {
    struct VotingDuration {
        uint startTime;
        uint endTime;
    }
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }
    struct Proposal {
        address proposalOwner;        
        string description;
        uint voteCount;
    }
    enum WorkflowStatus { 
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    Proposal[] private proposals;
    Proposal public winnerProposal;
    mapping(address => Voter) public voters;

    VotingDuration public votingDuration;
    mapping(address => bool) public whitelist;    

    WorkflowStatus public currentWorkflowStatus;

    event VoterRegistered(address voterAddress);
    event WorkflowStatusChanged(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    event ProposalRegistered(uint proposalId);
    event Voted (address voter, uint proposalId);

    constructor() Ownable(msg.sender) {
        currentWorkflowStatus = WorkflowStatus.RegisteringVoters;        
        votingDuration.startTime = block.timestamp;
     }   

    modifier voterInWhitelist() {
        require(whitelist[msg.sender] == true, "You should be in voter whitelist :)");
        _;
    }  

    function addVoter(address _newVoter) external onlyOwner {
        require(currentWorkflowStatus == WorkflowStatus.RegisteringVoters, "Setting a voter is no longer allowed");
        require(_newVoter != address(0), "address can't be empty");        
        voters[_newVoter].isRegistered = true;
        emit VoterRegistered(_newVoter);
    }

    function startProposalsRegistering() external onlyOwner {
        require(currentWorkflowStatus == WorkflowStatus.RegisteringVoters, "Voting session hasn't started yet");
        currentWorkflowStatus = WorkflowStatus.ProposalsRegistrationStarted;              
    }

    function endProposalsRegistering() external onlyOwner {
        require(currentWorkflowStatus == WorkflowStatus.ProposalsRegistrationStarted, "Voting session hasn't started yet");
        currentWorkflowStatus = WorkflowStatus.ProposalsRegistrationEnded;  
        emit WorkflowStatusChanged(WorkflowStatus.ProposalsRegistrationStarted, WorkflowStatus.ProposalsRegistrationEnded);            
    }

    function addProposal(string memory _description) external {
        require(currentWorkflowStatus == WorkflowStatus.ProposalsRegistrationStarted, "Proposals are not allowed anymore");
        require(msg.sender != address(0), "address can't be empty");
        require(voters[msg.sender].isRegistered, "You are not registered or not have permission");

        proposals.push(
            Proposal(msg.sender, _description, 0));
    }

    function startVotingSession() external onlyOwner {
        require(currentWorkflowStatus == WorkflowStatus.ProposalsRegistrationEnded, "Voting session hasn't started yet");
        currentWorkflowStatus = WorkflowStatus.VotingSessionStarted;   
        emit WorkflowStatusChanged(WorkflowStatus.ProposalsRegistrationEnded, WorkflowStatus.VotingSessionStarted); 
    }

    function endVotingSession() external onlyOwner {
        require(currentWorkflowStatus == WorkflowStatus.VotingSessionStarted, "Voting session hasn't started yet");
        currentWorkflowStatus = WorkflowStatus.VotingSessionEnded;  

        votingDuration.endTime = block.timestamp;

        emit WorkflowStatusChanged(WorkflowStatus.VotingSessionStarted, WorkflowStatus.VotingSessionEnded);   
    }

    function setVote(uint proposalId) external {        
        require(currentWorkflowStatus == WorkflowStatus.VotingSessionStarted, "Voting session hasn't started yet");
        require(proposals.length > 0, "No proposal has been submitted");

        uint256 indexProposalId = proposalId - 1; // Convert to zero-based array index: Eviter la proposition indice 0
        
        require(indexProposalId >= 0 && indexProposalId < proposals.length, "Proposal not found");
        require(!voters[msg.sender].hasVoted, "Already voted");

        voters[msg.sender].votedProposalId = proposalId; // on garde l'index côté appelant.
        voters[msg.sender].hasVoted = true;
        proposals[indexProposalId].voteCount++;
    }

    function tallyVotes() external onlyOwner {
        require(currentWorkflowStatus == WorkflowStatus.VotingSessionEnded, "Voting session hasn't started yet");
        currentWorkflowStatus = WorkflowStatus.VotesTallied ;  
        
        uint proposalIdWinner;
        uint proposalVoteCountMax;
        for(uint i = 0; i < proposals.length; i++) {
            if (proposals[i].voteCount > proposalVoteCountMax) {
                proposalIdWinner = i;
                proposalVoteCountMax = proposals[i].voteCount;
            }
        }

        winnerProposal = proposals[proposalIdWinner];
        
        emit WorkflowStatusChanged(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied );   
    }
    
    function getWinner() external view returns (Proposal memory) {  
        require(currentWorkflowStatus == WorkflowStatus.VotesTallied, "Voting session hasn't started yet");      
        return winnerProposal;
    }    

    function workflowStatus() external view returns (WorkflowStatus) {
        return currentWorkflowStatus;
    }
}