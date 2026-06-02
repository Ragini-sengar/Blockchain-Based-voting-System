// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    address public admin;
    bool public votingStarted;
    bool public votingEnded;

    struct Scheme {
        uint256 schemeId;
        string name;
        uint256 voteCount;
    }

    Scheme[] public schemes;

    mapping(uint256 => bool) public schemeExists;
    mapping(address => bool) public registeredVoters;
    mapping(address => bool) public hasVoted;

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    function addScheme(uint256 _schemeId, string memory _name) public onlyAdmin {
        require(!votingStarted, "Cannot add scheme after voting starts");
        require(!schemeExists[_schemeId], "Scheme already exists");

        schemes.push(Scheme(_schemeId, _name, 0));
        schemeExists[_schemeId] = true;
    }

    function registerVoter(address _voter) public onlyAdmin {
        registeredVoters[_voter] = true;
    }

    function startVoting() public onlyAdmin {
        require(schemes.length > 1, "Add at least 2 schemes");
        votingStarted = true;
        votingEnded = false;
    }

    function endVoting() public onlyAdmin {
        require(votingStarted, "Voting has not started");
        votingEnded = true;
    }

    function vote(uint256 schemeIndex) public {
        require(votingStarted, "Voting has not started");
        require(!votingEnded, "Voting has ended");
        require(registeredVoters[msg.sender], "You are not registered");
        require(!hasVoted[msg.sender], "You have already voted");
        require(schemeIndex < schemes.length, "Invalid scheme");

        hasVoted[msg.sender] = true;
        schemes[schemeIndex].voteCount++;
    }

    function getSchemes() public view returns (Scheme[] memory) {
        return schemes;
    }

    function getWinner() public view returns (
        uint256 winnerSchemeId,
        string memory winnerName,
        uint256 winnerVotes
    ) {
        require(votingEnded, "Voting has not ended yet");

        uint256 winnerIndex = 0;

        for (uint256 i = 1; i < schemes.length; i++) {
            if (schemes[i].voteCount > schemes[winnerIndex].voteCount) {
                winnerIndex = i;
            }
        }

        return (
            schemes[winnerIndex].schemeId,
            schemes[winnerIndex].name,
            schemes[winnerIndex].voteCount
        );
    }
}