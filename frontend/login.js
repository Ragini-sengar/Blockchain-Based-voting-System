let selectedRole = "user";
let savedAadhaar = "";
let savedAdminId = "";

function selectRole(role){
    selectedRole = role;

    document.getElementById("userTab").classList.remove("selected");
    document.getElementById("adminTab").classList.remove("selected");

    if(role === "user"){
        document.getElementById("userTab").classList.add("selected");
        document.getElementById("userLogin").style.display = "block";
        document.getElementById("adminLogin").style.display = "none";
    }else{
        document.getElementById("adminTab").classList.add("selected");
        document.getElementById("userLogin").style.display = "none";
        document.getElementById("adminLogin").style.display = "block";
    }

    document.getElementById("otpBox").style.display = "none";
}

function getOtpMethod(){
    return document.querySelector('input[name="otpMethod"]:checked').value;
}

async function sendOtp(){
    if(!document.getElementById("captchaCheck").checked){
        alert("Please verify captcha first");
        return;
    }

    let url;
    let body;

    if(selectedRole === "user"){
        savedAadhaar = document.getElementById("aadhaarInput").value;

        if(savedAadhaar.length !== 12){
            alert("Enter valid 12-digit Aadhaar number");
            return;
        }

        url = "http://localhost:5000/user/send-otp";
        body = {
            aadhaar:savedAadhaar,
            otpMethod:getOtpMethod()
        };
    }else{
        savedAdminId = document.getElementById("adminIdInput").value;

        if(!savedAdminId){
            alert("Enter Admin ID");
            return;
        }

        url = "http://localhost:5000/admin/send-otp";
        body = {
            admin_id:savedAdminId,
            otpMethod:getOtpMethod()
        };
    }

    const res = await fetch(url,{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify(body)
    });

    const data = await res.json();

    if(res.ok){
        alert("Demo OTP: " + data.demo_otp);
        document.getElementById("otpBox").style.display = "block";
    }else{
        alert(data.message);
    }
}

async function verifyOtp(){
    const otp = document.getElementById("otpInput").value;

    if(otp.length !== 6){
        alert("Enter valid 6-digit OTP");
        return;
    }

    let url;
    let body;

    if(selectedRole === "user"){
        url = "http://localhost:5000/user/verify-otp";
        body = {
            aadhaar:savedAadhaar,
            otp:otp
        };
    }else{
        url = "http://localhost:5000/admin/verify-otp";
        body = {
            admin_id:savedAdminId,
            otp:otp
        };
    }

    const res = await fetch(url,{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify(body)
    });

    const data = await res.json();

    if(res.ok){
        alert(data.message);

        if(selectedRole === "user"){
            localStorage.setItem("aadhaar", savedAadhaar);
            window.location.href = "user-dashboard.html";
        }else{
            localStorage.setItem("admin_id", savedAdminId);
            window.location.href = "admin-dashboard.html";
        }
    }else{
        alert(data.message);
    }
}
function toggleChat(){

    const chat =
    document.getElementById("chatWindow");

    if(chat.style.display === "block"){
        chat.style.display = "none";
    }
    else{
        chat.style.display = "block";
    }
}

function loginHelp(type){

    const answer =
    document.getElementById(
        "loginChatAnswer"
    );

    if(type === "login"){
        answer.innerText =
        "Enter your Aadhaar number, choose OTP delivery method, complete captcha and verify the OTP.";
    }

    if(type === "otp"){
        answer.innerText =
        "Wait a few seconds and click 'Resend OTP'. Ensure your registered mobile number or email is correct.";
    }

    if(type === "aadhaar"){
        answer.innerText =
        "Aadhaar is used only for identity verification and eligibility checking.";
    }

    if(type === "email"){
        answer.innerText =
        "Yes. You can receive OTP through your registered email or mobile number.";
    }

    if(type === "secure"){
        answer.innerText =
        "All voting records are stored securely. Votes are recorded on blockchain and cannot be altered.";
    }

    if(type === "blockchain"){
        answer.innerText =
        "Blockchain is a distributed ledger that stores votes securely and prevents tampering.";
    }

    if(type === "support"){
        answer.innerText =
        "For demo purposes please contact the system administrator.";
    }
}