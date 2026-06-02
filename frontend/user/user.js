const CONTRACT_ADDRESS =
"0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

const ABI = [
"function vote(uint256 schemeIndex)",
"function getSchemes() view returns ((uint256 schemeId,string name,uint256 voteCount)[])"
];

let provider;
let signer;
let contract;
let blockchainSchemes = [];

window.onload = function(){
    loadEligibleSchemes();
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
    "Connected Wallet: " + address;

    await loadBlockchainSchemes();
    await loadEligibleSchemes();
}

async function loadBlockchainSchemes(){

    if(!contract){
        return;
    }

    blockchainSchemes =
    await contract.getSchemes();
}

async function loadEligibleSchemes(){

    const aadhaar =
    localStorage.getItem("aadhaar");

    if(!aadhaar){
        alert("Please login first");
        window.location.href = "index.html";
        return;
    }

    const response =
    await fetch("http://localhost:5000/user/eligible-schemes", {
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            aadhaar:aadhaar
        })
    });

    const data =
    await response.json();

    const container =
    document.getElementById("schemeList");

    container.innerHTML = "";

    if(!data.schemes || data.schemes.length === 0){
        container.innerHTML =
        "<p>No eligible schemes available for you right now.</p>";
        return;
    }

    data.schemes.forEach((scheme)=>{

        const div =
        document.createElement("div");

        div.className =
        "scheme-card";

        div.innerHTML = `
            <h3>${scheme.name}</h3>
            <p>${scheme.description}</p>
            <p><b>Region:</b> ${scheme.region}</p>
            <p><b>Income Limit:</b> ₹${scheme.income_limit}</p>
            <p><b>Age:</b> ${scheme.age_min} - ${scheme.age_max}</p>
            <p><b>Gender:</b> ${scheme.gender}</p>
            <p><b>Expires On:</b> ${scheme.expiry_date}</p>

            <button onclick="voteForScheme(${scheme.scheme_id})">
                Vote for this Scheme
            </button>
        `;

        container.appendChild(div);
    });
}

async function voteForScheme(schemeId){

    if(!contract){
        alert("Connect MetaMask first");
        return;
    }

    await loadBlockchainSchemes();

    let schemeIndex = -1;

    blockchainSchemes.forEach((scheme,index)=>{
        if(Number(scheme.schemeId) === Number(schemeId)){
            schemeIndex = index;
        }
    });

    if(schemeIndex === -1){
        alert("This scheme is not available on blockchain yet");
        return;
    }

    const tx =
    await contract.vote(schemeIndex);

    await tx.wait();

    const aadhaar =
    localStorage.getItem("aadhaar");

    await fetch("http://localhost:5000/save-vote", {
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            scheme_id:schemeId,
            voter_aadhaar:aadhaar,
            transaction_hash:tx.hash
        })
    });

    alert("Vote cast successfully and saved on blockchain");

    loadEligibleSchemes();
}

function toggleChat(){

    const chat =
    document.getElementById("chatWindow");

    if(chat.style.display === "block"){
        chat.style.display = "none";
    }else{
        chat.style.display = "block";
    }
}

function chatAnswer(type){

    const answer =
    document.getElementById("chatAnswer");

    if(type === "vote"){
        answer.innerText =
        "Connect MetaMask and click Vote on an eligible scheme. Confirm the blockchain transaction.";
    }

    if(type === "eligible"){
        answer.innerText =
        "Eligibility is determined using age, income, gender, region and scheme expiry date.";
    }

    if(type === "twice"){
        answer.innerText =
        "No. The blockchain prevents a registered wallet from voting more than once.";
    }

    if(type === "admin"){
        answer.innerText =
        "Admin can see vote counts but cannot identify individual votes.";
    }

    if(type === "blockchain"){
        answer.innerText =
        "Blockchain stores voting records in an immutable manner so they cannot be changed.";
    }

    if(type === "metamask"){
        answer.innerText =
        "MetaMask is required to sign blockchain transactions securely.";
    }

    if(type === "change"){
        answer.innerText =
        "No. Once confirmed on blockchain, a vote cannot be changed.";
    }

    if(type === "after"){
        answer.innerText =
        "After voting, the transaction hash is stored and the vote count is updated.";
    }

    if(type === "support"){
        answer.innerText =
        "Contact the welfare scheme administrator for assistance.";
    }
}
function logout(){
    localStorage.removeItem("aadhaar");
    window.location.href = "../index.html";
}