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

// ====== Teacher Login (saaf aur secure message) ======
qs("teacherLoginBtn").onclick = ()=>{
  const user = qs("teacherUser").value.trim();
  const pass = qs("teacherPass").value;

  // Agar dono khaali hain
  if(!user && !pass){
    alert("Kripya username aur password daalein.");
    return;
  }

  // Check credentials
  if(user === TEACHER_USERNAME && pass === TEACHER_PASSWORD){
    onLogin({type:"teacher", name:"Teacher"});
  } else {
    // Generic error message: kisi ko correct credentials na dikhayein
    alert("Username ya password galat hai. Kripya dobara koshish karein.");
    // Optional: password field clear kar dena (security ke liye)
    const tp = qs("teacherPass");
    if(tp) tp.value = "";
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

  // Agar teacher hai to upload panel dikhao
  if (user && user.type === "teacher") {
    document.getElementById("teacherUploadPanel").style.display = "block";
  } else {
    document.getElementById("teacherUploadPanel").style.display = "none";
  }

  // show upload area for teacher when subject selected
  renderSubjects();

  updateTeacherStudentButtonVisibility(user);
}

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

// ===== Students view (teacher-only) =====
// Assumes localStorage may have students stored either as:
// 1) array of strings: ["a@mail", "91..."]
// 2) array of objects: [{contact, ts, type}]
// Key names tried: biom_students_v2, biom_students_v1, biom_students_v1 (fallback)
const STUDENTS_KEYS_TRY = ["biom_students_v2","biom_students_v1","biom_students_v0"];

function loadStudentsNormalized(){
  for(const key of STUDENTS_KEYS_TRY){
    const raw = localStorage.getItem(key);
    if(!raw) continue;
    try{
      const parsed = JSON.parse(raw);
      if(Array.isArray(parsed)){
        // If array of strings -> convert to objects
        if(parsed.length && typeof parsed[0] === "string"){
          return parsed.map((s,i)=>({ contact: s, ts: Date.now() - (parsed.length-i)*1000, type: (/^\+?\d{7,15}$/.test(s) || /^\d{10,13}$/.test(s)) ? "phone" : "email" }));
        }
        // If already objects with contact -> return as is
        if(parsed.length && typeof parsed[0] === "object" && parsed[0].contact) return parsed;
        if(parsed.length === 0) return [];
      }
    }catch(e){ continue; }
  }
  return []; // nothing found
}

function saveStudentsNormalized(arr){
  // save to preferred key
  localStorage.setItem("biom_students_v2", JSON.stringify(arr||[]));
}

// UI elements
const viewStudentsBtn = document.getElementById("viewStudentsBtn");
const studentsModal = document.getElementById("studentsModal");
const modalBackdrop = document.getElementById("modalBackdrop");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalStudentCount = document.getElementById("modalStudentCount");
const downloadCsvBtn = document.getElementById("downloadCsvBtn");

// Show modal - only teachers should see and click this button
function showStudentsModal(){
  const students = loadStudentsNormalized();
  const tbody = studentsModal.querySelector("tbody");
  tbody.innerHTML = "";
  students.forEach((s, idx)=>{
    const tr = document.createElement("tr");
    const td1 = document.createElement("td"); td1.innerText = idx+1;
    const td2 = document.createElement("td"); td2.innerText = s.contact;
    const td3 = document.createElement("td"); td3.innerText = (s.ts ? new Date(s.ts).toLocaleString() : "-");
    tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3);
    tbody.appendChild(tr);
  });
  modalStudentCount.innerText = students.length;
  studentsModal.style.display = "block";
}

// Close modal
if(closeModalBtn) closeModalBtn.onclick = ()=> studentsModal.style.display = "none";
if(modalBackdrop) modalBackdrop.onclick = ()=> studentsModal.style.display = "none";

// Download CSV
if(downloadCsvBtn) downloadCsvBtn.onclick = ()=>{
  const students = loadStudentsNormalized();
  if(students.length === 0){ alert("Koi students nahi hai."); return; }
  let csv = "No,Contact,Type,JoinedOn\n";
  students.forEach((s,i)=>{
    csv += `${i+1},"${s.contact}","${s.type || ""}","${s.ts ? new Date(s.ts).toLocaleString() : ""}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "students_list.csv";
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
};

// IMPORTANT: show/hide the viewStudentsBtn after login
// Call this function after successful login (inside your onLogin function)
function updateTeacherStudentButtonVisibility(user){
  // user is the object you create on login: {type:"teacher"|"student", name:...}
  if(!viewStudentsBtn) return;
  viewStudentsBtn.style.display = (user && user.type === "teacher") ? "inline-block" : "none";
}

// attach click
if(viewStudentsBtn) viewStudentsBtn.onclick = showStudentsModal;

// ====== LOGOUT FUNCTION ======
const logoutBtnEl = document.getElementById("logoutBtn");

if (logoutBtnEl) {
  logoutBtnEl.addEventListener("click", () => {
    // Hide dashboard and show login page again
    const dashboard = document.getElementById("dashboard");
    const loginPage = document.getElementById("loginPage");
    const teacherPanel = document.getElementById("teacherUploadPanel");
    const subjectArea = document.getElementById("subjectArea");

    if (dashboard) dashboard.style.display = "none";
    if (teacherPanel) teacherPanel.style.display = "none";
    if (subjectArea) subjectArea.style.display = "none";
    if (loginPage) loginPage.style.display = "block";

    // Reset user
    currentUser = null;

    // Optional alert
    alert("You have been logged out successfully!");

    // Clear teacher login fields
    const tUser = document.getElementById("teacherUser");
    const tPass = document.getElementById("teacherPass");
    if (tUser) tUser.value = "";
    if (tPass) tPass.value = "";
  });
}
