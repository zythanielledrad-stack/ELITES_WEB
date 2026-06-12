import { ads } from "./ads.js";

import { initializeApp, getApps, getApp } 
from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";

import {
  getFirestore,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

/* FIREBASE CONFIG */
const firebaseConfig = {
  apiKey: "AIzaSyAmzy_8B2h_sTtAKE2dVgfl2K-OXd5TVZg",
  authDomain: "voting-890f2.firebaseapp.com",
  projectId: "voting-890f2"
};

/* INITIALIZE (FIXED: prevents duplicate app error) */
const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

const db = getFirestore(app);

/* CREATE OVERLAY AUTOMATICALLY */
const overlay = document.createElement("div");

overlay.id = "maintenanceOverlay";

overlay.style.cssText = `
display:none;
position:fixed;
top:0;
left:0;
width:100%;
height:100%;
background:#000;
z-index:999999;
justify-content:center;
align-items:center;
flex-direction:column;
color:white;
text-align:center;
padding:20px;
`;

const randomAd = ads[Math.floor(Math.random() * ads.length)];

overlay.innerHTML = `


<style>


.ad-box{
	margin-top:35px;
	background:rgba(255,255,255,0.08);
	border:1px solid rgba(255,255,255,0.12);
	padding:25px;
	border-radius:20px;
	max-width:500px;
	width:100%;
	backdrop-filter:blur(10px);
	box-shadow:0 10px 30px rgba(0,0,0,0.4);
}

.ad-badge{
	display:inline-block;
	background:linear-gradient(135deg,#3b82f6,#10b981);
	padding:6px 14px;
	border-radius:999px;
	font-size:12px;
	font-weight:700;
	margin-bottom:15px;
}

.ad-title{
	font-size:28px;
	margin-bottom:10px;
	color:white;
}

.ad-description{
	font-size:17px;
	line-height:1.6;
	margin-bottom:20px;
	opacity:.9;
}

.ad-button{
	display:inline-block;
	padding:12px 24px;
	border-radius:12px;
	text-decoration:none;
	background:linear-gradient(135deg,#3b82f6,#10b981);
	color:white;
	font-weight:700;
	transition:.3s;
}

.ad-button:hover{
	transform:translateY(-3px);
}



@keyframes fadeIn {
  from {
    opacity:0;
  }
  to {
    opacity:1;
  }
}

#maintenanceOverlay{
  animation:fadeIn .5s ease;
  backdrop-filter:blur(6px);
}

/* GEAR ANIMATION */
.animation{
	margin-top:40px;
	display:inline-block;
	margin-bottom:40px;
}

.one, .two, .three{
	display:block;
	float:left;
}

.one{
	width:80px;
	height:80px;
	border:10px solid #3b82f6;
	border-radius:50%;
	border-top-color:transparent;
	margin-top:-10px;
	margin-right:8px;
}

.two{
	width:100px;
	height:100px;
	border:12px solid #10b981;
	border-radius:50%;
	border-bottom-color:transparent;
}

.three{
	width:80px;
	height:80px;
	border:10px solid #3b82f6;
	border-radius:50%;
	border-left-color:transparent;
	margin-top:-50px;
	margin-left:-10px;
}

.spin-one{
	animation:spin-one 1.5s infinite linear;
}

.spin-two{
	animation:spin-two 2s infinite linear;
}

@keyframes spin-one{
	0%{
		transform:rotate(0deg);
	}
	100%{
		transform:rotate(-359deg);
	}
}

@keyframes spin-two{
	0%{
		transform:rotate(0deg);
	}
	100%{
		transform:rotate(359deg);
	}
}

/* TEXT */
.maintenance-title{
	font-size:60px;
	margin-bottom:20px;
	background:linear-gradient(135deg,#3b82f6,#10b981);
	-webkit-background-clip:text;
	-webkit-text-fill-color:transparent;
	font-weight:800;
}

.maintenance-text{
	font-size:22px;
	margin:6px 0;
	color:white;
	opacity:.9;
}

@media(max-width:768px){

	.maintenance-title{
		font-size:38px;
	}

	.maintenance-text{
		font-size:18px;
	}

	.two{
		width:70px;
		height:70px;
	}

	.one,.three{
		width:55px;
		height:55px;
	}
}
</style>

<div class="animation">
    <div class="one spin-one"></div>
    <div class="two spin-two"></div>
    <div class="three spin-one"></div>
</div>

<h1 class="maintenance-title">
UNDER MAINTENANCE
</h1>

<p class="maintenance-text">
Website is temporarily unavailable
</p>

<p class="maintenance-text">
We apologize for any inconvenience caused
</p>

<p class="maintenance-text">
Contact administrator for more information
</p>

<p class="maintenance-text">
Email:
<a href="mailto:zythanielledrad@slsu.edu.ph" style="color:#3b82f6;">
zythanielledrad@slsu.edu.ph
</a>
</p>


<div class="ad-box">

  <span class="ad-badge">
    ANNOUNCEMENT
  </span>

  <h2 class="ad-title">
    ${randomAd.title}
  </h2>

  <p class="ad-description">
    ${randomAd.description}
  </p>

  <a href="${randomAd.link}" class="ad-button">
    ${randomAd.button}
  </a>

</div>


`;

document.body.appendChild(overlay);

/* FIRESTORE DOCUMENT */
const maintenanceRef = doc(db, "settings", "maintenance");

/* REALTIME LISTENER */
onSnapshot(maintenanceRef, (docSnap) => {

  if (!docSnap.exists()) {
    console.log("Maintenance document missing");
    return;
  }

  const data = docSnap.data();

  if (data.enabled === true) {
    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";
  } else {
    overlay.style.display = "none";
    document.body.style.overflow = "auto";
  }

});