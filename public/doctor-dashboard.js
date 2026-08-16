let actionId = null;
let actionType = null;
let appointments = [];



/* ============================
   DARK MODE
============================ */


const darkBtn = document.getElementById("darkModeBtn");


darkBtn.addEventListener("click", () => {

    document.body.classList.toggle("dark-mode");


    const icon = darkBtn.querySelector("i");


    if(document.body.classList.contains("dark-mode")){

        icon.className = "fa-solid fa-sun";
        darkBtn.innerHTML = `<i class="fa-solid fa-sun"></i> Light Mode`;

    }
    else{

        darkBtn.innerHTML = `<i class="fa-solid fa-moon"></i> Dark Mode`;

    }

});







/* ============================
   POPUP MANAGEMENT
============================ */


function openPopup(id,type){

    actionId=id;
    actionType=type;


    const overlay=document.getElementById("popupOverlay");
    const title=document.getElementById("popupTitle");
    const msg=document.getElementById("popupMsg");
    const reject=document.getElementById("rejectMsg");


    overlay.style.display="flex";



    if(type==="rejected"){


        title.innerText="Reject Appointment?";

        msg.innerText="Please provide rejection reason.";

        reject.style.display="block";


    }
    else{


        title.innerText="Confirm Action";

        msg.innerText=
        `Mark this appointment as ${type}?`;

        reject.style.display="none";


    }

}





document
.getElementById("cancelBtn")
.onclick=()=>{

document.getElementById("popupOverlay").style.display="none";

};







document
.getElementById("confirmBtn")
.onclick=async()=>{


try{


let body={

status:actionType

};



if(actionType==="rejected"){

body.doctorMessage=
document.getElementById("rejectMsg").value;

}




const response =
await fetch(`/api/appointments/${actionId}/status`,{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify(body)

});



if(response.ok){

loadAppointments();

}



}
catch(error){

console.error(error);

}



document.getElementById("popupOverlay").style.display="none";


};









/* ============================
   LOAD APPOINTMENTS
============================ */


async function loadAppointments(){


try{


const res =
await fetch("/api/appointments");



if(!res.ok){

document.getElementById("apptGrid").innerHTML=

`
<div class="empty-state">

<h3>Please login as Doctor</h3>

</div>
`;

return;

}




const data=await res.json();


appointments=data.appointments || [];



updateSummary();


renderAppointments();



}

catch(error){


console.error(error);


document.getElementById("apptGrid").innerHTML=

`
<div class="empty-state">

<h3>
Unable to load appointments
</h3>

</div>

`;

}



}








/* ============================
   SUMMARY UPDATE
============================ */


function updateSummary(){


document.getElementById("totalAppts")
.innerText=appointments.length;



document.getElementById("pendingAppts")
.innerText=

appointments.filter(
a=>a.status==="pending"
).length;



document.getElementById("approvedAppts")
.innerText=

appointments.filter(
a=>a.status==="approved"
).length;



document.getElementById("completedAppts")
.innerText=

appointments.filter(
a=>a.status==="completed"
).length;


}









/* ============================
   RENDER APPOINTMENTS
============================ */


function renderAppointments(){


const grid=
document.getElementById("apptGrid");



const search=
document
.getElementById("searchInput")
.value
.toLowerCase();



const status=
document
.getElementById("statusFilter")
.value;



grid.innerHTML="";



const filtered=
appointments.filter(a=>{


const name=
a.patient.name
.toLowerCase()
.includes(search);



const matchStatus=
status===""
||
a.status===status;



return name && matchStatus;


});





if(filtered.length===0){


grid.innerHTML=

`
<div class="empty-state">

<i class="fa-solid fa-calendar-xmark"></i>

<h3>
No appointments found
</h3>

</div>

`;

return;

}







filtered.forEach(a=>{


let progress=0;


if(a.status==="pending")
progress=40;


if(a.status==="approved")
progress=70;


if(a.status==="completed")
progress=100;





grid.innerHTML +=

`

<div class="card">


<div class="status-ring"

style="background:
conic-gradient(
#16a34a ${progress}%,
#e2e8f0 ${progress}%
);">

${progress}%

</div>





<h3>

<i class="fa-solid fa-user"></i>

${a.patient.name}

</h3>





<p>
<strong>Date:</strong>
${a.date}
</p>


<p>
<strong>Time:</strong>
${a.time}
</p>


<p>
<strong>Reason:</strong>
${a.reason || "-"}
</p>





<span class="badge ${a.status}">

${a.status.toUpperCase()}

</span>





<button 
style="background:#7c3aed"
onclick="viewPatient('${a.patient._id}')">

<i class="fa-solid fa-user"></i>

Patient Details

</button>






<div class="action-buttons">


<button 
class="approve"
onclick="openPopup('${a._id}','approved')">

Approve

</button>





<button 
class="reject"
onclick="openPopup('${a._id}','rejected')">

Reject

</button>





<button 
class="complete"
onclick="openPopup('${a._id}','completed')">

Complete

</button>


</div>





${
a.feedback ?

`

<div class="feedback-box">

<strong>
Feedback:
</strong>

${a.feedback.comment}


<br>


Rating:
${a.feedback.rating}/5


</div>

`
:
""

}


</div>

`;



});



}










/* ============================
   PATIENT DETAILS
============================ */


async function viewPatient(id){


try{


const res =
await fetch(`/api/appointments/patient/${id}`);



if(!res.ok){

alert("Patient not found");

return;

}



const data=
await res.json();



alert(

`
Patient Name:
${data.patient.name}


Email:
${data.patient.email}


Phone:
${data.patient.phone || "N/A"}


Age:
${data.patient.age || "N/A"}


Gender:
${data.patient.gender || "N/A"}

`

);



}

catch(error){

console.error(error);

}


}









/* ============================
   LOGOUT
============================ */


document
.getElementById("logoutBtn")
.onclick=async()=>{


await fetch("/api/auth/logout",{

method:"POST"

});


window.location.href="/";


};










/* ============================
   SEARCH + FILTER
============================ */


document
.getElementById("searchInput")
.addEventListener(
"input",
renderAppointments
);



document
.getElementById("statusFilter")
.addEventListener(
"change",
renderAppointments
);









/* ============================
   EXPORT CSV
============================ */


document
.getElementById("exportBtn")
.onclick=()=>{


let csv=

"Patient,Date,Time,Reason,Status\n";



appointments.forEach(a=>{


csv +=

`${a.patient.name},${a.date},${a.time},${a.reason || "-"},${a.status}\n`;



});




const blob =
new Blob(
[csv],
{
type:"text/csv"
}
);



const url=
URL.createObjectURL(blob);



const link=
document.createElement("a");



link.href=url;

link.download="appointments.csv";

link.click();



URL.revokeObjectURL(url);



};








/* ============================
   INITIAL LOAD
============================ */


loadAppointments();