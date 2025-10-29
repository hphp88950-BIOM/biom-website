// ====== Basic config ======
const TEACHER_USERNAME = "BIOM";
const TEACHER_PASSWORD = "welcomebiom143452";
const SUBJECTS = ["Biology","Physics","Chemistry","Hindi","English"];

// localStorage keys
const PDFS_KEY = "biom_pdfs_v1"; // stores array of {id,subject,name,data(u64),uploader,ts}
const STUDENTS_KEY = "biom_students_v1"; // stores array of contact strings

// ====== Helper functions ======
function qs(id){ return document.getElementById(id); }
function savePdfs(arr){ localStorage.setItem(PDFS_KEY, JSON.stringify(arr||[])); }
function loadPdfs(){ return JSON.parse(localStorage.getItem(PDFS_KEY)||"[]"); }
function saveStudents(arr){ localStorage.setItem(STUDENTS_KEY, JSON.stringify(arr||[])); }
function loadStudents(){ return JSON.parse(localStorage.getItem(STUDENTS_KEY)||"[]"); }
function uid(){ return 'id'+Date.now()+Math.floor(Math.random()*1000); }

// ====== Landing -> Login ======
const landing = qs("landing");
const enterBtn = qs("enterBtn");
const loginPage = qs("loginPage");
enterBtn.onclick = ()=>{ landing.style.display="none"; loginPage.style.display="block"; }

// ====== Tabs ======
const tabBtns = document.querySelectorAll(".tabbtn");
tabBtns.forEach(b=>{
  b.onclick = ()=>{
    tabBtns.forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    const t = b.dataset.type;
    qs("teacherForm").style.display = (t==="teacher") ? "block" : "none";
    qs("studentForm").style.display = (t==="student") ? "block" : "none";
  };
});

// ====== Teacher Login ======
qs("teacherLoginBtn").onclick = ()=>{
  const user = qs("teacherUser").value.trim();
  const pass = qs("teacherPass").value;
  if(user === TEACHER_USERNAME && pass === TEACHER_PASSWORD){
    onLogin({type:"teacher", name:"Teacher"});
  } else {
    alert("Teacher credentials galat hain. (Demo: BIOM / welcomebiom143452)");
  }
};

// ====== Student Login (OTP demo) ======
let currentOtp = null;
let pendingContact = null;
qs("sendOtpBtn").onclick = ()=>{
  const contact = qs("studentContact").value.trim();
  if(!contact){ alert("Email ya phone daalo."); return; }
  // generate OTP
  currentOtp = Math.floor(100000 + Math.random()*900000).toString();
  pendingContact = contact;
  // For real app: send OTP to email/phone via backend. Demo: show OTP in alert
  alert("Demo OTP: " + currentOtp + "\n(Real app me yeh SMS/Email se bheja jayega)");
  qs("otpSection").style.display = "block";
};
qs("verifyOtpBtn").onclick = ()=>{
  const typed = qs("otpInput").value.trim();
  if(typed === currentOtp){
    // mark student joined
    const students = loadStudents();
    if(!students.includes(pendingContact)){
      students.push(pendingContact);
      saveStudents(students);
    }
    onLogin({type:"student", name:pendingContact});
    currentOtp = null; pendingContact = null;
    qs("otpSection").style.display = "none";
    qs("otpInput").value = "";
    qs("studentContact").value = "";
  } else {
    alert("OTP galat hai. Dhyan se daalo.");
  }
};

// ====== After login ======
const loginEl = loginPage;
const dashboard = qs("dashboard");
const welcomeText = qs("welcomeText");
const logoutBtn = qs("logoutBtn");
const studentCountDisplay = qs("studentCountDisplay");
const studentCount = qs("studentCount");
let currentUser = null; // {type,name}

function onLogin(user){
  currentUser = user;
  loginEl.style.display = "none";
  dashboard.style.display = "block";
  welcomeText.innerText = (user.type==="teacher") ? "Welcome Teacher" : `Welcome ${user.name}`;
  // show student count only to teacher
  const students = loadStudents();
  studentCount.innerText = students.length;
  studentCountDisplay.style.display = (user.type==="teacher") ? "inline-block" : "none";

  // show upload area for teacher when subject selected
  renderSubjects();
}

logoutBtn.onclick = ()=>{
  currentUser = null;
  dashboard.style.display = "none";
  landing.style.display = "block";
};

// ====== Subjects rendering ======
function renderSubjects(){
  const container = qs("subjectsList");
  container.innerHTML = "";
  SUBJECTS.forEach(sub=>{
    const btn = document.createElement("button");
    btn.className = "subBtn";
    btn.innerText = sub;
    btn.onclick = ()=> openSubject(sub);
    container.appendChild(btn);
  });
}

// ====== Subject open ======
const subjectArea = qs("subjectArea");
const subjectTitle = qs("subjectTitle");
const uploadArea = qs("uploadArea");
const pdfItems = qs("pdfItems");
const pdfFileInput = qs("pdfFileInput");
const uploadPdfBtn = qs("uploadPdfBtn");

let currentSubject = null;

function openSubject(subject){
  currentSubject = subject;
  subjectTitle.innerText = subject;
  subjectArea.style.display = "block";
  // show upload only for teacher
  uploadArea.style.display = (currentUser && currentUser.type==="teacher") ? "block" : "none";
  renderPdfsForSubject();
}

// ====== Upload handler ======
uploadPdfBtn.onclick = ()=>{
  const file = pdfFileInput.files[0];
  if(!file){ alert("Pehle PDF file choose karo."); return; }
  if(file.type !== "application/pdf"){ alert("Sirf PDF file upload karo."); return; }

  const reader = new FileReader();
  reader.onload = function(e){
    const base64 = e.target.result; // data:application/pdf;base64,....
    const all = loadPdfs();
    all.push({
      id: uid(),
      subject: currentSubject,
      name: file.name,
      data: base64,
      uploader: currentUser.name || "Teacher",
      ts: Date.now()
    });
    savePdfs(all);
    pdfFileInput.value = "";
    alert("PDF uploaded successfully!");
    renderPdfsForSubject();
  };
  reader.readAsDataURL(file);
};

// ====== Render PDFs for current subject ======
function renderPdfsForSubject(){
  const list = loadPdfs().filter(p=>p.subject === currentSubject);
  pdfItems.innerHTML = "";
  if(list.length === 0){
    pdfItems.innerHTML = "<li>No PDFs uploaded yet for this subject.</li>";
    return;
  }
  list.forEach(item=>{
    const li = document.createElement("li");
    const left = document.createElement("div");
    left.innerHTML = `<strong>${item.name}</strong><div style="font-size:12px;color:#666">Uploaded by: ${item.uploader}</div>`;
    const right = document.createElement("div");
    // Download button (available to both)
    const dl = document.createElement("button");
    dl.className = "smallbtn";
    dl.innerText = "Download";
    dl.onclick = ()=> downloadPdf(item);
    right.appendChild(dl);

    // Delete button for teacher (optional)
    if(currentUser && currentUser.type === "teacher"){
      const del = document.createElement("button");
      del.className = "smallbtn";
      del.style.marginLeft = "8px";
      del.innerText = "Delete";
      del.onclick = ()=>{
        if(confirm("Delete this PDF?")){
          const all = loadPdfs().filter(p=>p.id !== item.id);
          savePdfs(all);
          renderPdfsForSubject();
        }
      };
      right.appendChild(del);
    }

    li.appendChild(left);
    li.appendChild(right);
    pdfItems.appendChild(li);
  });
}

// ====== Download helper ======
function downloadPdf(item){
  // item.data is dataURL
  const link = document.createElement("a");
  link.href = item.data;
  link.download = item.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// ====== On page load: if any saved data, ensure keys exist ======
(function init(){
  if(!localStorage.getItem(PDFS_KEY)) savePdfs([]);
  if(!localStorage.getItem(STUDENTS_KEY)) saveStudents([]);
  // optional: show landing
})();
