const CONTRACT_ADDRESS =
"0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

const ABI = [
"function addScheme(uint256 _schemeId, string _name)",
"function registerVoter(address _voter)",
"function startVoting()",
"function endVoting()",
"function vote(uint256 schemeIndex)",
"function getSchemes() view returns ((uint256 schemeId,string name,uint256 voteCount)[])",
"function getWinner() view returns (uint256 winnerSchemeId,string winnerName,uint256 winnerVotes)"
];

let provider;
let signer;
let contract;

document
.getElementById("connectBtn")
.addEventListener("click", connectWallet);

document
.getElementById("addCandidateBtn")
.addEventListener("click", addScheme);

document
.getElementById("registerBtn")
.addEventListener("click", registerVoter);

document
.getElementById("startBtn")
.addEventListener("click", startVoting);

document
.getElementById("endBtn")
.addEventListener("click", endVoting);

document
.getElementById("winnerBtn")
.addEventListener("click", showWinner);

async function connectWallet(){

    if(!window.ethereum){
        alert("Please install MetaMask");
        return;
    }

    provider =
    new ethers.BrowserProvider(window.ethereum);

    await provider.send(
        "eth_requestAccounts",
        []
    );

    signer =
    await provider.getSigner();

    contract =
    new ethers.Contract(
        CONTRACT_ADDRESS,
        ABI,
        signer
    );

    document.getElementById(
        "walletAddress"
    ).innerText =
    "Connected: " + await signer.getAddress();

    loadSchemes();
}

async function addScheme(){

    const name =
    document.getElementById(
        "candidateName"
    ).value;

    if(!name){
        alert("Enter scheme name");
        return;
    }

    const response =
    await fetch("http://localhost:5000/add-scheme", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: name,
            description: "Added from blockchain voting dashboard",
            age_min: 18,
            age_max: 100,
            gender: "Other",
            income_limit: 999999.00,
            region: "All",
            start_date: "2026-06-02",
            expiry_date: "2026-12-31"
        })
    });

    const data =
    await response.json();

    const schemeId =
    data.scheme_id;

    const tx =
    await contract.addScheme(
        schemeId,
        name
    );

    await tx.wait();

    alert("Scheme Added to Database and Blockchain");

    loadSchemes();
}

async function registerVoter(){

    const address =
    document.getElementById(
        "voterAddress"
    ).value;

    if(!address){
        alert("Enter voter wallet address");
        return;
    }

    const tx =
    await contract.registerVoter(address);

    await tx.wait();

    alert("Voter Registered on Blockchain");
}

async function startVoting(){

    const tx =
    await contract.startVoting();

    await tx.wait();

    alert("Voting Started");
}

async function endVoting(){

    const tx =
    await contract.endVoting();

    await tx.wait();

    alert("Voting Ended");
}

async function loadSchemes(){

    const schemes =
    await contract.getSchemes();

    const container =
    document.getElementById(
        "candidateList"
    );

    container.innerHTML = "";

    schemes.forEach((scheme,index)=>{

        const div =
        document.createElement("div");

        div.className =
        "candidate";

        div.innerHTML = `
            <h3>${scheme.name}</h3>
            <p>Scheme ID: ${scheme.schemeId}</p>
            <p>Votes: ${scheme.voteCount}</p>
            <button onclick="vote(${index})">
                Vote
            </button>
        `;

        container.appendChild(div);
    });
}

async function vote(index){

    const schemes =
    await contract.getSchemes();

    const selectedSchemeId =
    Number(schemes[index].schemeId);

    const tx =
    await contract.vote(index);

    await tx.wait();

    await fetch("http://localhost:5000/save-vote", {
        method: "POST",
        headers: {
            "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
            scheme_id: selectedSchemeId,
            voter_hash: await signer.getAddress(),
            transaction_hash: tx.hash
        })
    });

    alert("Vote Cast and Saved");

    loadSchemes();
}

async function showWinner(){

    const result =
    await contract.getWinner();

    document.getElementById(
        "winnerResult"
    ).innerText =
    `Winner Scheme ID: ${result[0]}
Winner: ${result[1]}
Votes: ${result[2]}`;
}