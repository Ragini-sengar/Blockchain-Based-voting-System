const CONTRACT_ADDRESS =
"0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

const ABI = [
"function addScheme(uint256 _schemeId, string _name)",
"function registerVoter(address _voter)",
"function startVoting()",
"function endVoting()",
"function getSchemes() view returns ((uint256 schemeId,string name,uint256 voteCount)[])",
"function getWinner() view returns (uint256 winnerSchemeId,string winnerName,uint256 winnerVotes)"
];

let provider;
let signer;
let contract;

window.onload = function(){
    const adminId =
    localStorage.getItem("admin_id");

    if(!adminId){
        alert("Please login as admin first");
        window.location.href = "index.html";
        return;
    }

    loadResults();
};

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

    const address =
    await signer.getAddress();

    document.getElementById(
        "walletAddress"
    ).innerText =
    "Connected Admin Wallet: " + address;

    await loadBlockchainSchemes();
}

async function createScheme(){

    if(!contract){
        alert("Connect admin wallet first");
        return;
    }

    const name =
    document.getElementById("schemeName").value;

    const description =
    document.getElementById("schemeDescription").value;

    const age_min =
    document.getElementById("ageMin").value;

    const age_max =
    document.getElementById("ageMax").value;

    const gender =
    document.getElementById("gender").value;

    const income_limit =
    document.getElementById("incomeLimit").value;

    const region =
    document.getElementById("region").value;

    const start_date =
    document.getElementById("startDate").value;

    const expiry_date =
    document.getElementById("expiryDate").value;

    if(!name || !description || !age_min || !age_max || !income_limit || !region || !start_date || !expiry_date){
        alert("Please fill all scheme details");
        return;
    }

    const response =
    await fetch("http://localhost:5000/admin/create-scheme", {
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            name,
            description,
            age_min,
            age_max,
            gender,
            income_limit,
            region,
            start_date,
            expiry_date
        })
    });

    const data =
    await response.json();

    if(!response.ok){
        alert(data.message || "Database scheme creation failed");
        return;
    }

    const schemeId =
    data.scheme_id;

    const tx =
    await contract.addScheme(
        schemeId,
        name
    );

    await tx.wait();

    alert("Scheme created in MySQL and added to blockchain");

    clearSchemeForm();
    loadResults();
    loadBlockchainSchemes();
}

async function registerVoter(){

    if(!contract){
        alert("Connect admin wallet first");
        return;
    }

    const voterWallet =
    document.getElementById("voterWallet").value;

    if(!voterWallet){
        alert("Enter voter wallet address");
        return;
    }

    const tx =
    await contract.registerVoter(voterWallet);

    await tx.wait();

    alert("Voter wallet registered on blockchain");

    document.getElementById("voterWallet").value = "";
}

async function startVoting(){

    if(!contract){
        alert("Connect admin wallet first");
        return;
    }

    const tx =
    await contract.startVoting();

    await tx.wait();

    alert("Voting started successfully");
}

async function endVoting(){

    if(!contract){
        alert("Connect admin wallet first");
        return;
    }

    const tx =
    await contract.endVoting();

    await tx.wait();

    alert("Voting ended successfully");
}

async function loadResults(){

    const response =
    await fetch("http://localhost:5000/admin/live-results");

    const results =
    await response.json();

    const container =
    document.getElementById("resultsList");

    container.innerHTML = "";

    if(results.length === 0){
        container.innerHTML =
        "<p>No schemes or votes available yet.</p>";
        return;
    }

    results.forEach((item)=>{

        const div =
        document.createElement("div");

        div.className =
        "scheme-card";

        div.innerHTML = `
            <h3>${item.name}</h3>
            <p><b>Scheme ID:</b> ${item.scheme_id}</p>
            <p><b>Total Votes:</b> ${item.total_votes}</p>

            <button onclick="closeScheme(${item.scheme_id})" class="red-btn">
                Close Scheme
            </button>
        `;

        container.appendChild(div);
    });
}

async function loadBlockchainSchemes(){

    if(!contract){
        return;
    }

    const schemes =
    await contract.getSchemes();

    const container =
    document.getElementById("blockchainSchemes");

    container.innerHTML = "";

    if(schemes.length === 0){
        container.innerHTML =
        "<p>No blockchain schemes added yet.</p>";
        return;
    }

    schemes.forEach((scheme)=>{

        const div =
        document.createElement("div");

        div.className =
        "scheme-card";

        div.innerHTML = `
            <h3>${scheme.name}</h3>
            <p><b>Scheme ID:</b> ${scheme.schemeId}</p>
            <p><b>Blockchain Votes:</b> ${scheme.voteCount}</p>
        `;

        container.appendChild(div);
    });
}

async function closeScheme(schemeId){

    const response =
    await fetch(
        `http://localhost:5000/admin/close-scheme/${schemeId}`,
        {
            method:"PUT"
        }
    );

    const data =
    await response.json();

    if(response.ok){
        alert("Scheme closed in database");
        loadResults();
    }else{
        alert(data.message || "Failed to close scheme");
    }
}

function clearSchemeForm(){

    document.getElementById("schemeName").value = "";
    document.getElementById("schemeDescription").value = "";
    document.getElementById("ageMin").value = "";
    document.getElementById("ageMax").value = "";
    document.getElementById("incomeLimit").value = "";
    document.getElementById("region").value = "";
    document.getElementById("startDate").value = "";
    document.getElementById("expiryDate").value = "";
}

function toggleChat(){

    const chat =
    document.getElementById("chatWindow");

    const answer =
    document.getElementById("chatAnswer");

    if(chat.style.display === "block"){
        chat.style.display = "none";
    }else{
        chat.style.display = "block";

        answer.innerText =
        "Hello Admin! I am the JanKalyan Vote Assistant. How can I help you today?";
    }
}

function chatAnswer(type){

    const answer =
    document.getElementById("chatAnswer");

    if(type === "scheme"){
        answer.innerText =
        "To create a scheme, fill in the scheme name, description, age range, gender, income limit, region, start date and expiry date. Then click Create Scheme. The scheme is saved in MySQL and also added to the blockchain.";
    }

    if(type === "voter"){
        answer.innerText =
        "To register a voter, paste the voter's MetaMask wallet address and click Register Voter. Only registered wallet addresses are allowed to vote on the blockchain.";
    }

    if(type === "start"){
        answer.innerText =
        "To start voting, first create at least two schemes and register voter wallets. Then click Start Voting and confirm the MetaMask transaction.";
    }

    if(type === "end"){
        answer.innerText =
        "To end voting, click End Voting and confirm the MetaMask transaction. After this, users will no longer be able to cast votes.";
    }

    if(type === "votes"){
        answer.innerText =
        "No. Admin cannot modify votes. Votes are stored on the blockchain, making them immutable and tamper-resistant.";
    }

    if(type === "expiry"){
        answer.innerText =
        "The expiry date is stored in MySQL. Expired schemes are automatically hidden from the user dashboard because the backend checks expiry_date before showing eligible schemes.";
    }

    if(type === "results"){
        answer.innerText =
        "Live results are shown using vote records saved in MySQL along with blockchain transaction hashes. You can also refresh blockchain schemes to view on-chain vote counts.";
    }

    if(type === "blockchain"){
        answer.innerText =
        "Blockchain is used to store vote counts securely. Once a vote is cast, it cannot be changed, deleted or manipulated by the admin.";
    }

    if(type === "closed"){
        answer.innerText =
        "If a scheme is closed, its status becomes CLOSED in MySQL. It will not appear in the user portal, but previous vote records remain stored safely.";
    }

    if(type === "support"){
        answer.innerText =
        "For technical support, contact the system administrator or check whether backend, Hardhat node, MySQL and frontend server are running properly.";
    }
}
function logout(){
    localStorage.removeItem("admin_id");
    window.location.href = "index.html";
}