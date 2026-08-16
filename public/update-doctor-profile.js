let originalData = {};

const defaultPhoto =
"https://cdn-icons-png.flaticon.com/512/147/147144.png";


/* =========================
   LOAD PROFILE
========================= */

async function loadProfile() {

    try {

        const res = await fetch("/api/auth/me", {
            credentials: "include"
        });


        const js = await res.json();


        if (!js.user) {

            showMsg("User not logged in", false);

            return;
        }


        const user = js.user;

        const form = document.getElementById("profileForm");


        form.name.value = user.name || "";
        form.email.value = user.email || "";
        form.phone.value = user.phone || "";
        form.age.value = user.age || "";
        form.gender.value = user.gender || "";



        if(user.photo){

            document.getElementById("profilePhoto").src =
            user.photo;

        }



        originalData = {

            name:form.name.value,

            email:form.email.value,

            phone:form.phone.value,

            age:form.age.value,

            gender:form.gender.value

        };


    }

    catch(error){

        console.error(error);

        showMsg(
        "Unable to load profile",
        false
        );

    }

}



loadProfile();





/* =========================
   UPDATE PROFILE
========================= */


document
.getElementById("profileForm")
.addEventListener(
"submit",
async function(e){


e.preventDefault();


const form=e.target;


const button=document.getElementById("submitBtn");


const body=
Object.fromEntries(
new FormData(form).entries()
);





// Password validation

if(
body.newPassword &&
body.newPassword !== body.confirmPassword
){

return showMsg(
"Passwords do not match",
false
);

}





// Check changes

let changed=false;


for(let key in originalData){

if(body[key] !== originalData[key]){

changed=true;

}

}




if(!changed && !body.newPassword){

return showMsg(
"No changes detected",
false
);

}




try{


button.disabled=true;

button.innerText="Updating...";





const res = await fetch(
"/api/profile/update",
{

method:"POST",

headers:{

"Content-Type":"application/json"

},

credentials:"include",

body:JSON.stringify(body)

});





const js=await res.json();




if(js.success){

originalData=body;


showMsg(
"✔ Profile Updated Successfully",
true
);


}

else{


showMsg(
js.message || "Update failed",
false
);


}



}

catch(error){


console.error(error);


showMsg(
"Server error. Try again later.",
false
);


}

finally{


button.disabled=false;

button.innerText="Save Changes";


}



});
 







/* =========================
   UPLOAD PHOTO
========================= */


document
.getElementById("uploadPhotoBtn")
.onclick=async()=>{


const input=
document.getElementById("photoInput");



if(!input.files.length){

return showMsg(
"Please select a photo",
false
);

}




const formData=new FormData();


formData.append(
"photo",
input.files[0]
);




try{


const res=await fetch(
"/api/profile/photo",
{

method:"POST",

credentials:"include",

body:formData

});



const js=await res.json();



if(js.success){


document
.getElementById("profilePhoto")
.src=
js.photo+"?"+Date.now();



showMsg(
"✔ Photo Updated",
true
);


}



}

catch(err){

console.log(err);

showMsg(
"Photo upload failed",
false
);

}


};







/* =========================
   REMOVE PHOTO
========================= */


document
.getElementById("removePhotoBtn")
.onclick=async()=>{


try{


const res=await fetch(
"/api/profile/photo/remove",
{

method:"DELETE",

credentials:"include"

});



const js=await res.json();



if(js.success){


document
.getElementById("profilePhoto")
.src=defaultPhoto;



showMsg(
"✔ Photo Removed",
true
);


}


}


catch(error){


showMsg(
"Unable to remove photo",
false
);


}


};







/* =========================
   MESSAGE SYSTEM
========================= */


function showMsg(text,success){


const box=
document.getElementById("msg");



if(success){


const popup=
document.getElementById(
"successPopup"
);



popup.classList.add(
"show"
);



setTimeout(()=>{

popup.classList.remove(
"show"
);

},1800);



box.style.display="none";


}

else{


box.style.display="block";


box.className="error";


box.innerText=text;



setTimeout(()=>{


box.style.display="none";


},3000);



}


}