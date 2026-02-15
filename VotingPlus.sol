// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";

import "./Voting.sol";

contract VotingPlus is Voting {    

    uint256[] public aequoWinnerProposalIds;

    constructor() Voting() {}

    function tallyVotesInternal() internal override  {      
        require(currentWorkflowStatus == WorkflowStatus.VotingSessionEnded, "Voting session hasn't started yet");
        currentWorkflowStatus = WorkflowStatus.VotesTallied ;  
        
        uint proposalIdWinner;
        uint proposalVoteCountMax;
        for(uint i = 0; i < proposals.length; i++) {
            Proposal memory currentProposal = proposals[i];
            if (currentProposal.voteCount > proposalVoteCountMax) {
                proposalIdWinner = i;
                proposalVoteCountMax = currentProposal.voteCount;

                delete aequoWinnerProposalIds;
            }

            if (proposalVoteCountMax != 0 && proposalVoteCountMax == currentProposal.voteCount) {
                aequoWinnerProposalIds.push(i);
            }
        }

        winnerProposal = proposals[proposalIdWinner];
        
        emit WorkflowStatusChanged(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied );  
    }

    // On laisse à l'admin choisir.
    function resolveAequo(uint _adminChoiseProposalId) external onlyOwner {
        require(aequoWinnerProposalIds.length > 0, "no aequo");

        require(_adminChoiseProposalId < proposals.length, "proposal id not found");
        bool isProposalIdFound;
        for( uint i = 0; i < aequoWinnerProposalIds.length; i++) {
            if (aequoWinnerProposalIds[i] == _adminChoiseProposalId) {
                winnerProposal = proposals[i];
                isProposalIdFound = true;
            }
        }        

        require(isProposalIdFound, "proposal id not found");
    }

}