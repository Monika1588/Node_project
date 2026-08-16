/* =========================
   ELEMENTS
========================= */


const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");

const doctorGrid = document.getElementById("doctorGrid");
const emptyMsg = document.getElementById("emptyMsg");

const searchInput = document.getElementById("searchName");
const specializationFilter = document.getElementById("filterSpecialization");

const modal = document.getElementById("doctorModal");
const closeModal = document.getElementById("closeModal");

const darkBtn = document.getElementById("darkBtn");

const logoutBtn = document.getElementById("logoutBtn");

let doctorsData = [];

/* =========================
   DARK MODE
========================= */


if(localStorage.getItem("mode") === "dark"){

    document.body.classList.add("dark-mode");

    darkBtn.innerHTML =
    `<i class="fa-solid fa-sun"></i> Light Mode`;

}



darkBtn.addEventListener("click",()=>{


    document.body.classList.toggle("dark-mode");


    if(document.body.classList.contains("dark-mode")){


        localStorage.setItem("mode","dark");


        darkBtn.innerHTML =
        `<i class="fa-solid fa-sun"></i> Light Mode`;


    }
    else{


        localStorage.setItem("mode","light");


        darkBtn.innerHTML =
        `<i class="fa-solid fa-moon"></i> Dark Mode`;


    }


});









/* =========================
   MOBILE SIDEBAR
========================= */


menuBtn.addEventListener("click",()=>{


    sidebar.classList.toggle("open");


});



document.addEventListener("click",(e)=>{


    if(
        window.innerWidth < 900 &&
        !sidebar.contains(e.target) &&
        !menuBtn.contains(e.target)
    ){

        sidebar.classList.remove("open");

    }


});









/* =========================
   LOAD LOGGED USER
========================= */


async function loadUser(){


try{


const response =
await fetch("/api/auth/me",
{
credentials:"include"
});


if(!response.ok){

console.log("User not logged in");

return;

}



const data =
await response.json();



const user=data.user;



if(!user)
return;




document.getElementById("userName")
.innerText=user.name || "Patient";



document.getElementById("userEmail")
.innerText=user.email || "";




document.getElementById("welcomeText")
.innerText=user.name || "Patient";





if(user.photo){

document.getElementById("userPhoto")
.src=user.photo;

}



}

catch(error){


console.log(
"User loading error",
error
);


}



}









/* =========================
   LOAD REAL DOCTORS
========================= */


async function loadDoctors(){



try{


doctorGrid.innerHTML=
`
<div class="loading">

<i class="fa-solid fa-spinner fa-spin"></i>

Loading doctors...

</div>
`;





const response =
await fetch(
"/api/appointments/doctors",
{
credentials:"include"
}
);





if(!response.ok){

throw new Error(
"Unable to fetch doctors"
);

}




const data =
await response.json();





doctorsData =
Array.isArray(data.doctors)
?
data.doctors.map(formatDoctor)
:
[];







populateSpecializations();



renderDoctors(doctorsData);





}

catch(error){



console.log(error);



doctorGrid.innerHTML=
`

<div class="empty-state">

<i class="fa-solid fa-triangle-exclamation"></i>

<h3>
Unable to load doctors
</h3>

<p>
Please try again later.
</p>


</div>


`;



}



}









/* =========================
 NORMALIZE DATA
========================= */


function formatDoctor(doc){



return{


_id:doc._id,


name:doc.name || "Doctor",


email:doc.email || "-",


phone:doc.phone || "-",


age:doc.age || "-",


gender:doc.gender || "-",


specialization:
doc.specialization || "General",


photo:
doc.photo ||
"https://cdn-icons-png.flaticon.com/512/3774/3774299.png"


};



}









/* =========================
 FILTER OPTIONS
========================= */


function populateSpecializations(){


specializationFilter.innerHTML=
`
<option value="">
All Specializations
</option>
`;



const specs =
[
...new Set(
doctorsData
.map(d=>d.specialization)
)
];




specs.forEach(spec=>{


const option =
document.createElement("option");


option.value=spec;

option.textContent=spec;


specializationFilter.appendChild(option);



});


}









/* =========================
 DISPLAY DOCTORS
========================= */


function renderDoctors(doctors){



doctorGrid.innerHTML="";



if(doctors.length===0){



emptyMsg.style.display="block";


return;


}



emptyMsg.style.display="none";




doctors.forEach(doc=>{



const card =
document.createElement("div");


card.className="card";





card.innerHTML=
`

<img 
src="${doc.photo}"
alt="${doc.name}">


<h3>
${doc.name}
</h3>


<p>
${doc.specialization}
</p>



<div class="actions">


<button 
class="btn btn-book">

Book Appointment

</button>



<button
class="btn btn-view">

View Details

</button>


</div>


`;






card
.querySelector(".btn-book")
.addEventListener(
"click",
()=>{


localStorage.setItem(
"book_doctorId",
doc._id
);


localStorage.setItem(
"book_doctorName",
doc.name
);



window.location.href=
"/book.html";


});







card
.querySelector(".btn-view")
.addEventListener(
"click",
()=>{


openDoctorModal(doc);


});







doctorGrid.appendChild(card);



});



}









/* =========================
 SEARCH + FILTER
========================= */


function filterDoctors(){



const name =
searchInput.value
.toLowerCase()
.trim();



const spec =
specializationFilter.value;





const filtered =
doctorsData.filter(doc=>{


const matchName =
doc.name
.toLowerCase()
.includes(name);



const matchSpec =
spec === "" ||
doc.specialization === spec;




return matchName && matchSpec;



});



renderDoctors(filtered);



}





searchInput.addEventListener(
"input",
filterDoctors
);



specializationFilter.addEventListener(
"change",
filterDoctors
);









/* =========================
 DOCTOR MODAL
========================= */


function openDoctorModal(doc){



document.getElementById("modalPhoto")
.src=doc.photo;



document.getElementById("modalName")
.innerText=doc.name;



document.getElementById("modalEmail")
.innerText=doc.email;



document.getElementById("modalPhone")
.innerText=doc.phone;



document.getElementById("modalAge")
.innerText=doc.age;



document.getElementById("modalGender")
.innerText=doc.gender;



document.getElementById("modalSpec")
.innerText=doc.specialization;




modal.style.display="flex";



}




closeModal.addEventListener(
"click",
()=>{

modal.style.display="none";

});




modal.addEventListener(
"click",
(e)=>{


if(e.target===modal){

modal.style.display="none";

}


});









/* =========================
 LOGOUT
========================= */


logoutBtn.addEventListener(
"click",
async()=>{


await fetch(
"/api/auth/logout",
{

method:"POST",

credentials:"include"

}

);



window.location.href="/";


});









/* =========================
 INITIALIZE
========================= */


(async()=>{


await loadUser();


await loadDoctors();


})();