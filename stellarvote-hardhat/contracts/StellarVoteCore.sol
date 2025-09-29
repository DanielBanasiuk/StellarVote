// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title StellarVoteCore — FHEVM 星际投票系统
contract StellarVoteCore is SepoliaConfig {
    struct Proposal {
        string title;
        string description;
        string[] choices;
        uint64 startTimestamp;
        uint64 endTimestamp;
        address creator;
        bool resultsRevealed;
    }

    struct EncryptedBallot {
        uint256 ballotId;
        uint256 proposalId;
        euint32 selection;
        address participant;
    }

    struct RevealedResults {
        uint256 proposalId;
        uint32[] tallies;
        string verificationProof;
        uint64 revealTime;
    }

    event ProposalInitiated(uint256 indexed proposalId, address indexed creator, string title, uint64 startTimestamp, uint64 endTimestamp);
    event BallotSubmitted(uint256 indexed proposalId, address indexed participant);
    event ResultsPublished(uint256 indexed proposalId, uint32[] tallies, string verificationProof);

    uint256 private _proposalCounter;
    uint256 private _ballotCounter;

    mapping(uint256 => Proposal) private _proposals;
    mapping(uint256 => uint256[]) private _proposalBallots;
    mapping(uint256 => EncryptedBallot) private _ballots;
    mapping(uint256 => mapping(address => uint32)) private _participantVoteCount;
    mapping(uint256 => uint32) private _maxVotesPerParticipant;
    mapping(uint256 => euint32[]) private _encryptedTallies;
    mapping(uint256 => RevealedResults) private _revealedResults;

    modifier proposalExists(uint256 proposalId) {
        require(bytes(_proposals[proposalId].title).length != 0, "proposal does not exist");
        _;
    }

    function initializeProposal(
        string memory title,
        string memory description,
        string[] memory choices,
        uint64 startTimestamp,
        uint64 endTimestamp,
        uint32 maxVotesPerUser
    ) external returns (uint256 proposalId) {
        require(bytes(title).length > 0, "title cannot be empty");
        require(choices.length >= 2, "minimum 2 choices required");
        require(endTimestamp > startTimestamp && endTimestamp > block.timestamp, "invalid time range");
        
        _proposalCounter += 1;
        proposalId = _proposalCounter;
        
        Proposal storage proposal = _proposals[proposalId];
        proposal.title = title;
        proposal.description = description;
        proposal.choices = choices;
        proposal.startTimestamp = startTimestamp;
        proposal.endTimestamp = endTimestamp;
        proposal.creator = msg.sender;
        proposal.resultsRevealed = false;
        
        _maxVotesPerParticipant[proposalId] = maxVotesPerUser == 0 ? 1 : maxVotesPerUser;
        
        emit ProposalInitiated(proposalId, msg.sender, title, startTimestamp, endTimestamp);
    }

    function submitEncryptedChoice(uint256 proposalId, externalEuint32 input, bytes calldata proof) external proposalExists(proposalId) {
        Proposal storage proposal = _proposals[proposalId];
        require(block.timestamp >= proposal.startTimestamp && block.timestamp <= proposal.endTimestamp, "voting not active");
        
        uint32 currentVotes = _participantVoteCount[proposalId][msg.sender];
        require(currentVotes < _maxVotesPerParticipant[proposalId], "vote limit exceeded");
        
        _participantVoteCount[proposalId][msg.sender] = currentVotes + 1;
        
        euint32 encryptedChoice = FHE.fromExternal(input, proof);
        FHE.allowThis(encryptedChoice);
        FHE.allow(encryptedChoice, msg.sender);
        
        _ballotCounter += 1;
        uint256 ballotId = _ballotCounter;
        
        _ballots[ballotId] = EncryptedBallot({
            ballotId: ballotId,
            proposalId: proposalId,
            selection: encryptedChoice,
            participant: msg.sender
        });
        
        _proposalBallots[proposalId].push(ballotId);
        
        emit BallotSubmitted(proposalId, msg.sender);
    }

    function submitEncryptedVector(uint256 proposalId, externalEuint32[] calldata vectorChoices, bytes calldata proof) external proposalExists(proposalId) {
        Proposal storage proposal = _proposals[proposalId];
        require(block.timestamp >= proposal.startTimestamp && block.timestamp <= proposal.endTimestamp, "voting not active");
        require(vectorChoices.length == proposal.choices.length, "choice vector length mismatch");
        
        uint32 currentVotes = _participantVoteCount[proposalId][msg.sender];
        require(currentVotes < _maxVotesPerParticipant[proposalId], "vote limit exceeded");
        
        _participantVoteCount[proposalId][msg.sender] = currentVotes + 1;
        
        euint32[] memory encryptedVector = new euint32[](vectorChoices.length);
        for (uint256 i = 0; i < vectorChoices.length; i++) {
            encryptedVector[i] = FHE.fromExternal(vectorChoices[i], proof);
        }
        
        euint32[] storage tallies = _encryptedTallies[proposalId];
        if (tallies.length == 0) {
            for (uint256 i = 0; i < encryptedVector.length; i++) {
                tallies.push(encryptedVector[i]);
            }
        } else {
            require(tallies.length == encryptedVector.length, "tally vector length mismatch");
            for (uint256 i = 0; i < encryptedVector.length; i++) {
                tallies[i] = FHE.add(tallies[i], encryptedVector[i]);
            }
        }
        
        for (uint256 i = 0; i < encryptedVector.length; i++) {
            FHE.allowThis(tallies[i]);
            FHE.allow(tallies[i], proposal.creator);
            FHE.allow(tallies[i], msg.sender);
        }
        
        emit BallotSubmitted(proposalId, msg.sender);
    }

    function getProposalDetails(uint256 proposalId)
        external
        view
        proposalExists(proposalId)
        returns (string memory title, string memory description, string[] memory choices, uint64 startTimestamp, uint64 endTimestamp, bool resultsRevealed, address creator)
    {
        Proposal storage proposal = _proposals[proposalId];
        return (proposal.title, proposal.description, proposal.choices, proposal.startTimestamp, proposal.endTimestamp, proposal.resultsRevealed, proposal.creator);
    }

    function getTotalProposals() external view returns (uint256) { 
        return _proposalCounter; 
    }

    function getProposalStatus(uint256 proposalId) external view proposalExists(proposalId) returns (uint8) {
        Proposal storage proposal = _proposals[proposalId];
        if (proposal.resultsRevealed) return 3; // results published
        if (block.timestamp < proposal.startTimestamp) return 0; // pending
        if (block.timestamp <= proposal.endTimestamp) return 1; // active
        return 2; // ended
    }

    function getEncryptedTallies(uint256 proposalId) external view proposalExists(proposalId) returns (euint32[] memory) {
        euint32[] storage tallies = _encryptedTallies[proposalId];
        euint32[] memory result = new euint32[](tallies.length);
        for (uint256 i = 0; i < tallies.length; i++) {
            result[i] = tallies[i];
        }
        return result;
    }

    function publishResults(uint256 proposalId, uint32[] calldata tallies, string calldata verificationProof) external proposalExists(proposalId) {
        Proposal storage proposal = _proposals[proposalId];
        require(block.timestamp > proposal.endTimestamp, "voting still active");
        require(!proposal.resultsRevealed, "results already published");
        require(tallies.length == proposal.choices.length, "tally length mismatch");
        
        _revealedResults[proposalId] = RevealedResults({
            proposalId: proposalId,
            tallies: tallies,
            verificationProof: verificationProof,
            revealTime: uint64(block.timestamp)
        });
        
        proposal.resultsRevealed = true;
        
        emit ResultsPublished(proposalId, tallies, verificationProof);
    }

    function getPublishedResults(uint256 proposalId) external view proposalExists(proposalId) returns (RevealedResults memory) { 
        return _revealedResults[proposalId]; 
    }

    function getParticipantVoteCount(address participant, uint256 proposalId) external view returns (uint32) { 
        return _participantVoteCount[proposalId][participant]; 
    }
    
    function getMaxVotesPerParticipant(uint256 proposalId) external view returns (uint32) { 
        return _maxVotesPerParticipant[proposalId]; 
    }
}
