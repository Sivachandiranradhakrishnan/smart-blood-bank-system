const API_URL = "https://smart-blood-bank-system-i7wo.onrender.com/api";

let currentUser = null;
let allUsers = [];
let generatedOTP = "";

// ===================== UTILS =====================
function token() { return localStorage.getItem("token"); }

function headers() {
  return { "Content-Type": "application/json", Authorization: "Bearer " + token() };
}

function showEl(id) { document.getElementById(id)?.classList.remove("hidden"); }
function hideEl(id) { document.getElementById(id)?.classList.add("hidden"); }

function setMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = "form-msg" + (type ? " " + type : "");
}

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function calcAge(dob) {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// ===================== THEME =====================
function toggleTheme() {
  const t = document.body.getAttribute("data-theme") === "dark" ? "light" : "dark";
  document.body.setAttribute("data-theme", t);
  localStorage.setItem("theme", t);
}
(function() { const t = localStorage.getItem("theme"); if(t) document.body.setAttribute("data-theme", t); })();

// ===================== SIDEBAR =====================
function toggleSidebar() {
  const adminSidebar = document.getElementById("adminSidebar");
  const userSidebar = document.getElementById("userSidebar");
  const overlay = document.getElementById("sidebarOverlay");

  if (adminSidebar && document.getElementById("adminPage")?.classList.contains("active")) {
    adminSidebar.classList.toggle("open");
    overlay?.classList.toggle("show");
  }

  if (userSidebar && document.getElementById("userPage")?.classList.contains("active")) {
    userSidebar.classList.toggle("open");
    overlay?.classList.toggle("show");
  }
}

function closeSidebar() {
  document.getElementById("adminSidebar")?.classList.remove("open");
  document.getElementById("userSidebar")?.classList.remove("open");
  document.getElementById("sidebarOverlay")?.classList.remove("show");
}

function closeSidebar() {
  document.getElementById("adminSidebar")?.classList.remove("open");
  document.getElementById("userSidebar")?.classList.remove("open");
  document.getElementById("sidebarOverlay")?.classList.remove("show");
}

// ===================== AUTH PAGE INIT =====================
async function initLoginPage() {
  try {
    const res = await fetch(`${API_URL}/donors/stock`);
    const stock = await res.json();
    const total = stock.reduce((a,b) => a + b.total, 0);
    const avail = stock.reduce((a,b) => a + b.available, 0);
    document.getElementById("statDonors").textContent = total;
    document.getElementById("statUnits").textContent = avail;
  } catch{}
}

function switchAuthTab(tab) {
  const isLogin = tab === "login";
  document.getElementById("loginForm").classList.toggle("hidden", !isLogin);
  document.getElementById("registerForm").classList.toggle("hidden", isLogin);
  document.querySelectorAll(".atab").forEach((btn, i) => {
    btn.classList.toggle("active", (i === 0 && isLogin) || (i === 1 && !isLogin));
  });
}

// ===================== AGE CHECK ON REGISTER =====================
function checkAge() {
  const dob = document.getElementById("regDob").value;
  if (!dob) return;
  const age = calcAge(dob);
  const display = document.getElementById("ageRoleDisplay");
  display.classList.remove("hidden");
  if (age < 18) {
    display.innerHTML = `<strong>Age: ${age}</strong> — Registered as <strong>Receiver Only</strong>. Must be 18+ to donate blood.`;
    display.className = "role-display text-error";
  } else {
    display.innerHTML = `<strong>Age: ${age}</strong> — Registered as <strong>Donor + Receiver</strong>.`;
    display.className = "role-display text-success";
  }
}

// ===================== REGISTER =====================
async function sendOTP() {
  const username = document.getElementById("regUser").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const fullName = document.getElementById("regName").value.trim();

  if (!username || !phone || !fullName) {
    return setMsg("registerMsg", "Fill name, username, and phone first.", "error");
  }

  generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
  showEl("otpSection");
  setMsg("registerMsg", `Demo OTP sent to ${phone}: ${generatedOTP}`, "success");
}

async function register() {
  const enteredOTP = document.getElementById("otpInput").value.trim();

  if (!enteredOTP) return setMsg("registerMsg", "Enter the OTP first.", "error");
  if (enteredOTP !== generatedOTP) return setMsg("registerMsg", "Incorrect OTP. Try again.", "error");

  const username = document.getElementById("regUser").value.trim();
  const password = document.getElementById("regPass").value;
  const fullName = document.getElementById("regName").value.trim();
  const dob = document.getElementById("regDob").value;
  const bloodGroup = document.getElementById("regBlood").value;
  const phone = document.getElementById("regPhone").value.trim();
  const city = document.getElementById("regCity").value.trim();
  const weight = document.getElementById("regWeight").value;

  if (!username || !password || !fullName || !dob || !bloodGroup || !phone || !city) {
    return setMsg("registerMsg", "All fields are required.", "error");
  }

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({username,password,fullName,dob,bloodGroup,phone,city,weight})
    });
    const data = await res.json();
    if (res.ok) {
      setMsg("registerMsg", data.message, "success");
      setTimeout(() => switchAuthTab("login"), 1500);
    } else {
      setMsg("registerMsg", data.message, "error");
    }
  } catch {
    setMsg("registerMsg", "Cannot connect to server.", "error");
  }
}


// ===================== LOGIN =====================
async function login() {
  const username = document.getElementById("loginUser").value.trim();
  const password = document.getElementById("loginPass").value;
  if (!username || !password) return setMsg("loginMsg", "Enter username and password.", "error");

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) return setMsg("loginMsg", data.message, "error");

    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.isAdmin ? "admin" : "user");
    currentUser = data;

    // Birthday check
    if (data.isBirthday) showBirthdayPopup(data);

    if (data.isAdmin) {
      showPage("adminPage");
      initAdmin();
    } else {
      showPage("userPage");
      initUser(data);
    }
  } catch {
    setMsg("loginMsg", "Cannot connect to server. Is the backend running?", "error");
  }
}

// ===================== BIRTHDAY POPUP =====================
function showBirthdayPopup(data) {
  const popup = document.getElementById("birthdayPopup");
  const title = document.getElementById("birthdayTitle");
  const msg = document.getElementById("birthdayMsg");
  if (data.justTurned18) {
    title.textContent = "🎂 Happy 18th Birthday!";
    msg.textContent = `Happy 18th Birthday, ${data.fullName}! 🎉 You are now officially eligible to donate blood and save lives! Your donor features have been unlocked. Make your first donation today! 🩸`;
  } else {
    title.textContent = "🎂 Happy Birthday!";
    msg.textContent = `Happy Birthday, ${data.fullName}! 🎉 Thank you for being part of our blood bank family. Your kindness saves lives every day! 🩸`;
  }
  showEl("birthdayPopup");
}
function closeBirthday() { hideEl("birthdayPopup"); }

// ===================== LOGOUT =====================
function logout() { localStorage.clear(); currentUser = null; showPage("loginPage"); initLoginPage(); }

// ===================== ADMIN =====================
function adminSection(name) {
  document.querySelectorAll(".asec").forEach(s=>s.classList.remove("active"));
  document.getElementById("sec-"+name).classList.add("active");
  document.querySelectorAll(".slink").forEach(b=>b.classList.toggle("active", b.getAttribute("onclick")&&b.getAttribute("onclick").includes(name)));
  document.getElementById("adminPageTitle").textContent = name.charAt(0).toUpperCase()+name.slice(1);
  if(name==="dashboard") loadAdminDashboard();
  else if(name==="users") loadAdminUsers();
  else if(name==="donations") loadAdminDonations();
  else if(name==="requests") loadAdminRequests();
  else if(name==="stock") loadAdminStock();
  else if(name==="events") loadAdminEvents();
  else if(name==="analytics") loadAnalytics();
}

async function initAdmin() {
  loadAdminDashboard();
  loadNotifCount("admin");
}

async function loadAdminDashboard() {
  try {
    const [users, requests, donations, stock, dom] = await Promise.all([
      fetch(`${API_URL}/auth/users`,{headers:headers()}).then(r=>r.json()),
      fetch(`${API_URL}/requests/all`,{headers:headers()}).then(r=>r.json()),
      fetch(`${API_URL}/donors/all-history`,{headers:headers()}).then(r=>r.json()),
      fetch(`${API_URL}/donors/stock`).then(r=>r.json()),
      fetch(`${API_URL}/donors/donor-of-month`).then(r=>r.json())
    ]);

    const donors = users.filter(u=>calcAge(u.dob)>=18);
    document.getElementById("adTotalDonors").textContent = donors.length;
    document.getElementById("adTotalRequests").textContent = requests.length;
    document.getElementById("adPendingReq").textContent = requests.filter(r=>r.status==="pending").length;
    document.getElementById("adLivesSaved").textContent = requests.filter(r=>r.status==="approved").length;

    // Stock bars
    const maxStock = Math.max(...stock.map(s=>s.total), 1);
    document.getElementById("adminStockBars").innerHTML = stock.map(s => {
      const pct = Math.round((s.available/Math.max(s.total,1))*100);
      const cls = s.available >= 5 ? "good" : s.available >= 2 ? "low" : "critical";
      return `<div class="stock-bar-item">
        <span class="stock-bar-label">${s.bloodGroup}</span>
        <div class="stock-bar-track"><div class="stock-bar-fill ${cls}" style="width:${Math.max((s.total/maxStock)*100,4)}%"></div></div>
        <span class="stock-bar-count">${s.available} avail / ${s.total} total</span>
      </div>`;
    }).join("");

    // Donor of month
    const domEl = document.getElementById("donorOfMonth");
    if (dom) {
      domEl.innerHTML = `<div class="donor-month"><div style="font-size:2.5rem">🏆</div><div class="dom-name">${dom.donorName}</div><div class="dom-bg">${dom.bloodGroup}</div><div class="dom-count">${dom.count} donation(s) this month</div></div>`;
    } else {
      domEl.innerHTML = `<div class="dom-empty">No donations this month yet</div>`;
    }

    // Recent requests
    const recent = requests.slice(0,5);
    document.getElementById("recentRequests").innerHTML = recent.length ? recent.map(r=>`
      <div class="request-card ${r.isEmergency?'emergency':''}">
        <div class="req-top">
          <div><span class="req-blood">${r.bloodGroup}</span> <strong>${r.receiverName}</strong></div>
          <span class="req-status ${r.status}">${r.status.toUpperCase()}</span>
        </div>
        <div class="req-info">📍 ${r.city} | Reason: ${r.reason} | ${fmtDate(r.createdAt)}</div>
      </div>`).join("") : `<div class="empty"><div class="ei">📋</div><p>No requests yet</p></div>`;

  } catch(err) { console.error(err); }
}

async function loadAdminUsers() {
  try {
    const res = await fetch(`${API_URL}/auth/users`,{headers:headers()});
    allUsers = await res.json();
    renderUserTable(allUsers);
  } catch{}
}

function renderUserTable(users) {
  document.getElementById("userTable").innerHTML = users.length ? `
    <table>
      <thead><tr><th>Name</th><th>Blood Group</th><th>Age</th><th>City</th><th>Phone</th><th>Donations</th><th>Points</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>${users.map(u=>`
        <tr>
          <td>${u.fullName}</td>
          <td><span class="blood-tag">${u.bloodGroup}</span></td>
          <td>${calcAge(u.dob)}</td>
          <td>${u.city}</td>
          <td style="color:var(--red-light);font-weight:600">${u.phone}</td>
          <td>${u.donationCount||0}</td>
          <td>${u.rewardPoints||0}</td>
          <td><span class="dc-status ${u.isAvailable?'available':'unavailable'}">${u.isAvailable?'✅ Available':'🔴 Unavailable'}</span></td>
          <td><button class="btn-reject" onclick="deleteUser('${u._id}')">Delete</button></td>
        </tr>`).join("")}
      </tbody>
    </table>` : `<div class="empty"><div class="ei">👥</div><p>No users registered yet</p></div>`;
}

function filterUsers() {
  const q = document.getElementById("userSearch").value.toLowerCase();
  renderUserTable(allUsers.filter(u => u.fullName.toLowerCase().includes(q) || u.bloodGroup.toLowerCase().includes(q) || u.city.toLowerCase().includes(q)));
}

async function deleteUser(id) {
  if (!confirm("Delete this user?")) return;
  await fetch(`${API_URL}/auth/users/${id}`,{method:"DELETE",headers:headers()});
  loadAdminUsers();
}

async function loadAdminDonations() {
  try {
    const res = await fetch(`${API_URL}/donors/all-history`,{headers:headers()});
    const donations = await res.json();
    document.getElementById("donationTable").innerHTML = donations.length ? `
      <table>
        <thead><tr><th>Donor</th><th>Blood Group</th><th>City</th><th>Date</th><th>Certificate ID</th></tr></thead>
        <tbody>${donations.map(d=>`
          <tr>
            <td>${d.donorName||d.donor?.fullName||'—'}</td>
            <td><span class="blood-tag">${d.bloodGroup}</span></td>
            <td>${d.city||'—'}</td>
            <td>${fmtDate(d.donationDate)}</td>
            <td style="font-family:monospace;font-size:0.78rem;color:var(--text2)">${d.certificateId}</td>
          </tr>`).join("")}
        </tbody>
      </table>` : `<div class="empty"><div class="ei">💉</div><p>No donations yet</p></div>`;
  } catch{}
}

async function loadAdminRequests() {
  try {
    const res = await fetch(`${API_URL}/requests/all`,{headers:headers()});
    const requests = await res.json();
    document.getElementById("requestTable").innerHTML = requests.length ? requests.map(r=>`
      <div class="request-card ${r.isEmergency?'emergency':''}">
        <div class="req-top">
          <div><span class="req-blood">${r.bloodGroup}</span> <strong>${r.receiverName}</strong> ${r.isEmergency?'<span style="color:var(--red-light);font-weight:700">🚨 EMERGENCY</span>':''}</div>
          <span class="req-status ${r.status}">${r.status.toUpperCase()}</span>
        </div>
        <div class="req-info">
          📍 ${r.city} | Reason: ${r.reason} | Urgency: ${r.urgency}<br>
          📞 Receiver Phone: <strong style="color:var(--red-light)">${r.receiverPhone}</strong><br>
          📅 ${fmtDate(r.createdAt)}
          ${r.message?`<br>💬 ${r.message}`:''}
        </div>
        ${r.interestedDonors&&r.interestedDonors.length>0?`
          <div class="interested-list">
            <h4>✅ Interested Donors (${r.interestedDonors.length})</h4>
            ${r.interestedDonors.map(d=>`<div class="int-donor"><span>${d.donorName} — ${d.donorCity}</span><span class="phone">📞 ${d.donorPhone}</span></div>`).join("")}
          </div>`:``}
        ${r.allMatchingDonors&&r.allMatchingDonors.length>0?`
          <div class="all-donors-list">
            <h4>All ${r.bloodGroup} Donors to Contact (Case 2)</h4>
            ${r.allMatchingDonors.map(d=>`<div class="int-donor"><span>${d.fullName} — ${d.city} ${d.isAvailable?'✅':'🔴'}</span><span class="phone">📞 ${d.phone}</span></div>`).join("")}
          </div>`:``}
        ${r.status==="pending"?`
          <div class="req-actions">
            <button class="btn-approve" onclick="updateRequest('${r._id}','approved')">✅ Approve</button>
            <button class="btn-reject" onclick="updateRequest('${r._id}','rejected')">❌ Reject</button>
          </div>`:``}
      </div>`).join("") : `<div class="empty"><div class="ei">🩸</div><p>No blood requests yet</p></div>`;
  } catch{}
}

async function updateRequest(id, status) {
  await fetch(`${API_URL}/requests/${id}/status`,{method:"PUT",headers:headers(),body:JSON.stringify({status})});
  loadAdminRequests();
  loadAdminDashboard();
}

async function loadAdminStock() {
  try {
    const res = await fetch(`${API_URL}/donors/stock`);
    const stock = await res.json();
    document.getElementById("adminStockGrid").innerHTML = stock.map(s=>{
      const cls = s.available>=5?"good":s.available>=2?"low":"critical";
      const alert = s.available>=5?"✅ Good Stock":s.available>=2?"⚠️ Low Stock":"🚨 Critical!";
      return `<div class="stock-card ${cls}">
        <div class="stock-bg">${s.bloodGroup}</div>
        <div class="stock-num">${s.available}</div>
        <div class="stock-label">Available Units</div>
        <div class="stock-label" style="margin-top:4px">Total Donors: ${s.total}</div>
        <div class="stock-alert ${cls}">${alert}</div>
      </div>`;
    }).join("");
  } catch{}
}

async function loadAdminEvents() {
  try {
    const res = await fetch(`${API_URL}/events`);
    const events = await res.json();
    document.getElementById("adminEventsList").innerHTML = events.length ? events.map(e=>`
      <div class="event-card">
        <div class="event-info">
          <h4>🩸 ${e.title}</h4>
          <p>📅 ${fmtDate(e.date)} | 📍 ${e.location}, ${e.city||''}<br>${e.description||''}</p>
        </div>
        <div class="event-slots">
          <div class="slots-num">${e.availableSlots}</div>
          <div class="slots-label">Slots Left</div>
          <button class="btn-reject" style="margin-top:8px" onclick="deleteEvent('${e._id}')">Delete</button>
        </div>
      </div>`).join("") : `<div class="empty"><div class="ei">📅</div><p>No events created yet</p></div>`;
  } catch{}
}

async function deleteEvent(id) {
  if (!confirm("Delete this event?")) return;
  await fetch(`${API_URL}/events/${id}`,{method:"DELETE",headers:headers()});
  loadAdminEvents();
}

function openEventModal() { showEl("eventModal"); }
function closeEventModal() { hideEl("eventModal"); }

async function createEvent() {
  const title = document.getElementById("evTitle").value.trim();
  const date = document.getElementById("evDate").value;
  const location = document.getElementById("evLocation").value.trim();
  const city = document.getElementById("evCity").value.trim();
  const totalSlots = document.getElementById("evSlots").value;
  const description = document.getElementById("evDesc").value.trim();
  if (!title||!date||!location) return alert("Fill required fields");
  await fetch(`${API_URL}/events`,{method:"POST",headers:headers(),body:JSON.stringify({title,date,location,city,totalSlots,description})});
  closeEventModal();
  loadAdminEvents();
}

async function loadAnalytics() {
  try {
    const [requests, donations, stock] = await Promise.all([
      fetch(`${API_URL}/requests/all`,{headers:headers()}).then(r=>r.json()),
      fetch(`${API_URL}/donors/all-history`,{headers:headers()}).then(r=>r.json()),
      fetch(`${API_URL}/donors/stock`).then(r=>r.json())
    ]);

    // Most requested blood group
    const bgCount = {};
    requests.forEach(r=>{ bgCount[r.bloodGroup]=(bgCount[r.bloodGroup]||0)+1; });
    const mostReq = Object.entries(bgCount).sort((a,b)=>b[1]-a[1])[0];
    document.getElementById("mostRequested").textContent = mostReq ? `${mostReq[0]} (${mostReq[1]})` : "—";

    // Total lives saved
    document.getElementById("totalLivesSaved").textContent = requests.filter(r=>r.status==="approved").length;

    // Month donations
    const now = new Date();
    const monthDon = donations.filter(d=>new Date(d.donationDate).getMonth()===now.getMonth()).length;
    document.getElementById("monthDonations").textContent = monthDon;

    // Top city (analytics)
    document.getElementById("topCity").textContent = "Analytics Available";

    // BG distribution
    document.getElementById("bgDistribution").innerHTML = stock.map(s=>`
      <div class="bg-dist-item">
        <div class="bgd-group">${s.bloodGroup}</div>
        <div class="bgd-count">${s.total} donors</div>
      </div>`).join("");
  } catch{}
}

// ===================== USER PANEL =====================
async function initUser(data) {
  currentUser = data;
  document.getElementById("userGreeting").textContent = `👤 ${data.fullName}`;
  await loadUserProfile();
  loadUserHome();
  loadNotifCount("user");
}

async function loadUserProfile() {
  try {
    const res = await fetch(`${API_URL}/auth/profile`,{headers:headers()});
    currentUser = {...currentUser, ...await res.json()};
  } catch{}
}
function adminSection(name) {
  document.querySelectorAll(".asec").forEach(s => s.classList.remove("active"));
  document.getElementById("sec-" + name).classList.add("active");
  document.querySelectorAll(".slink").forEach(b =>
    b.classList.toggle("active", b.getAttribute("onclick") && b.getAttribute("onclick").includes(name))
  );
  document.getElementById("adminPageTitle").textContent = name.charAt(0).toUpperCase() + name.slice(1);

  if (name === "dashboard") loadAdminDashboard();
  else if (name === "users") loadAdminUsers();
  else if (name === "donations") loadAdminDonations();
  else if (name === "requests") loadAdminRequests();
  else if (name === "stock") loadAdminStock();
  else if (name === "events") loadAdminEvents();
  else if (name === "analytics") loadAnalytics();

  closeSidebar();
}
async function loadUserHome() {
  await loadUserProfile();
  const u = currentUser;
  const age = calcAge(u.dob);
  document.getElementById("heroTitle").textContent = `Welcome back, ${u.fullName}! 👋`;
  document.getElementById("heroSub").textContent = age < 18 ? `You can donate blood when you turn 18. ${18-age} year(s) to go!` : u.canDonate ? "You are eligible to donate blood today!" : `Rest for ${u.daysUntilNextDonation} more days before next donation.`;
  document.getElementById("uDonationCount").textContent = u.donationCount||0;
  document.getElementById("uPoints").textContent = u.rewardPoints||0;
  document.getElementById("uStreak").textContent = u.donationStreak||0;
  document.getElementById("uDaysLeft").textContent = u.daysUntilNextDonation>0 ? u.daysUntilNextDonation : age<18 ? "N/A" : "Ready!";

  // Badges
  const allBadges = [
    {name:"First Drop",emoji:"🥉",req:1},
    {name:"Life Saver",emoji:"🥈",req:5},
    {name:"Hero Donor",emoji:"🥇",req:10},
    {name:"Legend",emoji:"👑",req:20}
  ];
  document.getElementById("myBadges").innerHTML = allBadges.map(b=>`
    <div class="badge-item ${(u.badges||[]).includes(b.name)?'earned':''}">
      ${b.emoji} ${b.name} ${(u.badges||[]).includes(b.name)?'✅':'('+b.req+' donations)'}
    </div>`).join("");

  // Matching requests
  try {
    const res = await fetch(`${API_URL}/requests/matching`,{headers:headers()});
    const reqs = await res.json();
    document.getElementById("matchingRequests").innerHTML = reqs.length ? reqs.slice(0,4).map(r=>`
      <div class="match-req-item">
        <h4>${r.bloodGroup} needed in ${r.city} ${r.isEmergency?'🚨':''}</h4>
        <p>${r.reason} • ${fmtDate(r.createdAt)}</p>
        <button class="btn-interest" style="margin-top:6px;font-size:0.75rem;padding:4px 10px" onclick="showInterest('${r._id}')">I'm Interested ✋</button>
      </div>`).join("") : `<div style="color:var(--text3);font-size:0.83rem;padding:10px">No matching requests right now</div>`;
  } catch{}
}

function loadDonateSection() {
  const u = currentUser;
  const age = calcAge(u.dob);
  const el = document.getElementById("donateContent");

  if (age < 18) {
    el.innerHTML = `<div class="donate-locked">
      <div style="font-size:3rem;margin-bottom:16px">🔒</div>
      <h3>You must be 18 or older to donate blood</h3>
      <p style="color:var(--text2);margin-top:8px">You are currently ${age} years old. Come back on your 18th birthday! 🎂</p>
    </div>`;
    return;
  }

  const days = u.daysUntilNextDonation||0;
  if (days > 0) {
    const pct = Math.round(((60-days)/60)*100);
    const circum = 2*Math.PI*70;
    const offset = circum - (pct/100)*circum;
    el.innerHTML = `<div class="donate-card">
      <h3 style="margin-bottom:20px">Rest Period Active</h3>
      <div class="countdown-ring">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle class="ring-track" cx="80" cy="80" r="70"/>
          <circle class="ring-fill" cx="80" cy="80" r="70" stroke-dasharray="${circum}" stroke-dashoffset="${offset}"/>
        </svg>
        <div class="countdown-text">
          <div class="countdown-days">${days}</div>
          <div class="countdown-label">days left</div>
        </div>
      </div>
      <p style="color:var(--text2);font-size:0.88rem">You donated recently. Your body needs rest. You can donate again after ${days} more days.</p>
      <p style="color:var(--text2);font-size:0.8rem;margin-top:8px">Progress: ${pct}% recovery complete</p>
    </div>`;
    return;
  }

  el.innerHTML = `<div class="donate-card">
    <div style="font-size:3.5rem;margin-bottom:16px">🩸</div>
    <h3 style="margin-bottom:8px">You are eligible to donate!</h3>
    <p style="color:var(--text2);margin-bottom:20px;font-size:0.88rem">Your blood group: <strong style="color:var(--red-light)">${u.bloodGroup}</strong><br>Every donation can save up to 3 lives!</p>
    <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:14px;margin-bottom:20px;text-align:left">
      <p style="font-size:0.8rem;color:var(--text2);line-height:2">
        💧 Drink plenty of water before donating<br>
        🍌 Eat a healthy meal 2-3 hours before<br>
        😴 Get a good night's sleep<br>
        ❌ Avoid alcohol 24 hours before<br>
        🏥 Wear comfortable clothes
      </p>
    </div>
    <button class="btn-primary full" onclick="confirmDonate()">Donate Blood Now 🩸</button>
  </div>`;
}

async function confirmDonate() {
  if (!confirm("Confirm your blood donation?")) return;
  try {
    const res = await fetch(`${API_URL}/donors/donate`,{method:"POST",headers:headers()});
    const data = await res.json();
    if (res.ok) {
      currentUser = {...currentUser, ...data.user};
      showCertificate(data.donation, data.user);
      loadUserHome();
    } else alert("Error: " + data.message);
  } catch{ alert("Error connecting to server"); }
}

function showCertificate(donation, user) {
  document.getElementById("certContent").innerHTML = `
    <div class="cert-title">Certificate of Blood Donation</div>
    <div style="font-size:3rem">🩸</div>
    <div class="cert-main">This is to certify that</div>
    <div class="cert-name">${donation.donorName||user.fullName}</div>
    <div class="cert-details">
      has voluntarily donated blood on<br>
      <strong>${fmtDate(donation.donationDate)}</strong><br>
      Blood Group: <strong>${donation.bloodGroup||user.bloodGroup}</strong><br>
      Location: ${donation.city||user.city}
    </div>
    <div class="cert-id">Certificate ID: ${donation.certificateId}</div>
    <div class="cert-footer">Smart Blood Bank Management System • Thank you for saving lives!</div>`;
  showEl("certModal");
}

function closeCert() { hideEl("certModal"); }
function printCert() { window.print(); }

async function submitRequest() {
  const bloodGroup = document.getElementById("reqBlood").value;
  const city = document.getElementById("reqCity").value.trim();
  const reason = document.getElementById("reqReason").value.trim();
  const urgency = document.getElementById("reqUrgency").value;
  const message = document.getElementById("reqMsg").value.trim();
  if (!bloodGroup||!city||!reason) return setMsg("reqMsg2","❌ Fill all required fields","error");

  try {
    const res = await fetch(`${API_URL}/requests`,{method:"POST",headers:headers(),body:JSON.stringify({bloodGroup,city,reason,urgency,message,isEmergency:urgency==="emergency"})});
    const data = await res.json();
    if (res.ok) { setMsg("reqMsg2","✅ Request sent to all matching donors!","success"); }
    else setMsg("reqMsg2","❌ "+data.message,"error");
  } catch{ setMsg("reqMsg2","❌ Error sending request","error"); }
}

async function triggerSOS() {
  const u = currentUser;
  if (!u) return;
  const bloodGroup = prompt("Enter blood group needed (e.g. B+):");
  if (!bloodGroup) return;
  try {
    const res = await fetch(`${API_URL}/requests`,{method:"POST",headers:headers(),body:JSON.stringify({bloodGroup,city:u.city,reason:"EMERGENCY - SOS",urgency:"emergency",message:"SOS Emergency Request",isEmergency:true})});
    if (res.ok) alert("🚨 SOS sent! All matching donors have been notified. Admin will contact you shortly.");
  } catch{ alert("Error sending SOS"); }
}

async function searchDonors() {
  const bg = document.getElementById("searchBG").value;
  const city = document.getElementById("searchCity").value.trim();
  try {
    let url = `${API_URL}/donors?`;
    if (bg) url += `bloodGroup=${encodeURIComponent(bg)}&`;
    if (city) url += `city=${encodeURIComponent(city)}`;
    const res = await fetch(url);
    const donors = await res.json();
    document.getElementById("searchResults").innerHTML = donors.length ? donors.map(d=>`
      <div class="donor-card">
        <div class="dc-blood">${d.bloodGroup}</div>
        <div class="dc-name">${d.fullName}</div>
        <div class="dc-info">📍 ${d.city}<br>⚖️ ${d.weight||'—'} kg<br>💉 ${d.donationCount||0} donations</div>
        <div class="dc-status ${d.isAvailable&&d.canDonate?'available':'unavailable'}">${d.isAvailable&&d.canDonate?'🟢 Available':'🔴 Not Available'}</div>
      </div>`).join("") : `<div class="empty"><div class="ei">🔍</div><p>No donors found</p></div>`;
  } catch{}
}

async function loadMyRequests() {
  try {
    const res = await fetch(`${API_URL}/requests/my`,{headers:headers()});
    const reqs = await res.json();
    document.getElementById("myRequestsList").innerHTML = reqs.length ? reqs.map(r=>`
      <div class="request-card ${r.isEmergency?'emergency':''}">
        <div class="req-top">
          <span class="req-blood">${r.bloodGroup}</span>
          <span class="req-status ${r.status}">${r.status.toUpperCase()}</span>
        </div>
        <div class="req-info">📍 ${r.city} | ${r.reason} | Urgency: ${r.urgency}<br>📅 ${fmtDate(r.createdAt)}</div>
      </div>`).join("") : `<div class="empty"><div class="ei">📋</div><p>No requests made yet</p></div>`;
  } catch{}
}

async function loadMyHistory() {
  try {
    const res = await fetch(`${API_URL}/donors/history`,{headers:headers()});
    const donations = await res.json();
    document.getElementById("myDonationHistory").innerHTML = donations.length ? donations.map(d=>`
      <div class="history-item">
        <div class="hi-left">
          <h4>🩸 Blood Donated — ${d.bloodGroup}</h4>
          <p>📅 ${fmtDate(d.donationDate)} | 📍 ${d.city}</p>
        </div>
        <span class="hi-cert" onclick='showCertFromHistory(${JSON.stringify(d)})'>📜 View Certificate</span>
      </div>`).join("") : `<div class="empty"><div class="ei">💉</div><p>No donations yet</p></div>`;
  } catch{}
}

function showCertFromHistory(d) {
  document.getElementById("certContent").innerHTML = `
    <div class="cert-title">Certificate of Blood Donation</div>
    <div style="font-size:3rem">🩸</div>
    <div class="cert-main">This is to certify that</div>
    <div class="cert-name">${d.donorName}</div>
    <div class="cert-details">
      donated blood on <strong>${fmtDate(d.donationDate)}</strong><br>
      Blood Group: <strong>${d.bloodGroup}</strong><br>
      Location: ${d.city}
    </div>
    <div class="cert-id">Certificate ID: ${d.certificateId}</div>
    <div class="cert-footer">Smart Blood Bank Management System</div>`;
  showEl("certModal");
}

async function loadProfileSection() {
  await loadUserProfile();
  const u = currentUser;
  const age = calcAge(u.dob);
  document.getElementById("profileContent").innerHTML = `
    <div class="profile-card">
      <div class="profile-header">
        <div class="profile-avatar">${(u.fullName||'U')[0]}</div>
        <div>
          <div class="profile-name">${u.fullName}</div>
          <span class="profile-blood">${u.bloodGroup}</span>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
        <div class="field"><label>Full Name</label><input type="text" id="pName" value="${u.fullName}"/></div>
        <div class="field"><label>City</label><input type="text" id="pCity" value="${u.city}"/></div>
        <div class="field"><label>Weight (kg)</label><input type="number" id="pWeight" value="${u.weight||''}"/></div>
        <div class="field"><label>Age</label><input type="text" value="${age} years old" disabled style="opacity:0.6"/></div>
      </div>
      ${age>=18?`<div class="profile-toggle">
        <label class="toggle-switch"><input type="checkbox" id="availToggle" ${u.isAvailable?'checked':''} onchange="toggleAvailability()"/><span class="toggle-slider"></span></label>
        <div><strong>Available to Donate</strong><br><small style="color:var(--text2)">Toggle off if you are busy or travelling</small></div>
      </div>`:''}
      <button class="btn-primary" onclick="saveProfile()">Save Changes</button>
    </div>`;
}

async function saveProfile() {
  const fullName = document.getElementById("pName").value;
  const city = document.getElementById("pCity").value;
  const weight = document.getElementById("pWeight").value;
  try {
    const res = await fetch(`${API_URL}/auth/profile`,{method:"PUT",headers:headers(),body:JSON.stringify({fullName,city,weight})});
    if (res.ok) { alert("✅ Profile updated!"); await loadUserProfile(); }
  } catch{}
}

async function toggleAvailability() {
  await fetch(`${API_URL}/donors/availability`,{method:"PUT",headers:headers()});
  await loadUserProfile();
}

async function showInterest(reqId) {
  try {
    const res = await fetch(`${API_URL}/requests/${reqId}/interest`,{method:"POST",headers:headers()});
    const data = await res.json();
    alert(res.ok ? "✅ "+data.message : "❌ "+data.message);
    loadUserHome();
  } catch{}
}

// ===================== COMPATIBILITY =====================
const COMPAT = {
  "A+":  { donateTo:["A+","AB+"], receiveFrom:["A+","A-","O+","O-"], rare:"Common (35%)", fact:"Second most common blood group. Compatible with A and AB types." },
  "A-":  { donateTo:["A+","A-","AB+","AB-"], receiveFrom:["A-","O-"], rare:"Uncommon (6%)", fact:"Rare but universal plasma donor. Can donate to all A and AB types." },
  "B+":  { donateTo:["B+","AB+"], receiveFrom:["B+","B-","O+","O-"], rare:"Common (8%)", fact:"Common in South Asian populations. Compatible with B and AB types." },
  "B-":  { donateTo:["B+","B-","AB+","AB-"], receiveFrom:["B-","O-"], rare:"Rare (2%)", fact:"Very rare. Can donate to all B and AB recipients." },
  "AB+": { donateTo:["AB+"], receiveFrom:["A+","A-","B+","B-","AB+","AB-","O+","O-"], rare:"Uncommon (3%)", fact:"Universal recipient! Can receive from all blood types." },
  "AB-": { donateTo:["AB+","AB-"], receiveFrom:["A-","B-","AB-","O-"], rare:"Rarest (1%)", fact:"Rarest blood type. Universal plasma donor." },
  "O+":  { donateTo:["A+","B+","AB+","O+"], receiveFrom:["O+","O-"], rare:"Most Common (38%)", fact:"Most common blood type. Can donate to all positive types." },
  "O-":  { donateTo:["A+","A-","B+","B-","AB+","AB-","O+","O-"], receiveFrom:["O-"], rare:"Uncommon (7%)", fact:"Universal donor! Can donate to anyone. Most critical for emergencies." }
};

function loadCompatibility() {
  document.getElementById("bgInfoGrid").innerHTML = Object.entries(COMPAT).map(([bg,info])=>`
    <div class="bg-info-card" onclick="selectCompatBG('${bg}')">
      <div class="bgi-group">${bg}</div>
      <div class="bgi-rare">${info.rare}</div>
      <div class="bgi-fact">${info.fact}</div>
    </div>`).join("");
}

function selectCompatBG(bg) {
  document.getElementById("compatBG").value = bg;
  checkCompatibility();
}

function checkCompatibility() {
  const bg = document.getElementById("compatBG").value;
  if (!bg) return;
  const info = COMPAT[bg];
  if (!info) return;
  document.getElementById("compatResult").innerHTML = `
    <div class="compat-result">
      <h3 style="font-family:var(--font-display);font-size:1.4rem">Blood Group <span style="color:var(--red-light)">${bg}</span></h3>
      <p style="color:var(--text2);font-size:0.85rem;margin-top:6px">${info.fact}</p>
      <p style="color:var(--text2);font-size:0.8rem;margin-top:4px">Rarity: <strong>${info.rare}</strong></p>
      <div class="compat-row">
        <div class="compat-box">
          <h4>Can Donate To</h4>
          <div class="compat-tags">${info.donateTo.map(b=>`<span class="ctag">${b}</span>`).join("")}</div>
        </div>
        <div class="compat-box">
          <h4>Can Receive From</h4>
          <div class="compat-tags">${info.receiveFrom.map(b=>`<span class="ctag">${b}</span>`).join("")}</div>
        </div>
      </div>
    </div>`;
}

// ===================== EVENTS =====================
async function loadUserEvents() {
  try {
    const res = await fetch(`${API_URL}/events`);
    const events = await res.json();
    document.getElementById("userEventsList").innerHTML = events.length ? events.map(e=>`
      <div class="event-card">
        <div class="event-info">
          <h4>🩸 ${e.title}</h4>
          <p>📅 ${fmtDate(e.date)} | 📍 ${e.location}${e.city?', '+e.city:''}<br>${e.description||''}</p>
        </div>
        <div class="event-slots">
          <div class="slots-num">${e.availableSlots}</div>
          <div class="slots-label">Slots Left</div>
          <button class="btn-primary" style="margin-top:8px;padding:7px 14px;font-size:0.8rem" onclick="registerEvent('${e._id}')">Register</button>
        </div>
      </div>`).join("") : `<div class="empty"><div class="ei">📅</div><p>No upcoming events</p></div>`;
  } catch{}
}

async function registerEvent(id) {
  try {
    const res = await fetch(`${API_URL}/events/${id}/register`,{method:"POST",headers:headers()});
    const data = await res.json();
    alert(res.ok ? "✅ "+data.message : "❌ "+data.message);
    loadUserEvents();
  } catch{}
}

// ===================== FAQ =====================
function loadFAQ() {
  const faqs = [
    {q:"Who can donate blood?",a:"Anyone between 18-65 years old, weighing at least 50kg, and in good health can donate blood. You should not have any major illnesses or infections."},
    {q:"How often can I donate blood?",a:"Whole blood can be donated every 60 days (about 3 months). This gives your body enough time to replenish the donated blood."},
    {q:"What are the age requirements?",a:"You must be at least 18 years old to donate blood. There is no upper age limit as long as you are in good health, though some centers cap at 65."},
    {q:"What are the benefits of donating blood?",a:"Blood donation helps save lives, burns calories, reduces harmful iron stores, lowers risk of heart disease, and gives you a free mini health checkup. It also gives a sense of fulfillment."},
    {q:"What should I eat before donating?",a:"Eat a healthy, iron-rich meal 2-3 hours before donating. Include foods like spinach, beans, red meat, and vitamin C-rich foods. Drink plenty of water and avoid fatty foods."},
    {q:"What should I avoid before donating?",a:"Avoid alcohol for 24 hours before donation. Do not donate if you are sick, on antibiotics, or feeling unwell. Avoid heavy exercise right before donating."},
    {q:"How long does the donation process take?",a:"The actual blood donation takes only 8-10 minutes. However, the whole process including registration, health check, and rest time takes about 45-60 minutes."},
    {q:"Is blood donation safe?",a:"Yes, blood donation is completely safe. New, sterile, disposable equipment is used for each donor. You cannot get any disease by donating blood."},
    {q:"What happens to my blood after donation?",a:"Your blood is tested, processed, and separated into components. It can then be used to help patients in surgeries, accidents, cancer treatments, and more. One donation can save up to 3 lives!"}
  ];
  document.getElementById("faqList").innerHTML = faqs.map((f,i)=>`
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFAQ(${i})"><span>${f.q}</span><span id="faqArrow${i}">▼</span></div>
      <div class="faq-a" id="faqA${i}">${f.a}</div>
    </div>`).join("");
}

function toggleFAQ(i) {
  const a = document.getElementById("faqA"+i);
  const arrow = document.getElementById("faqArrow"+i);
  a.classList.toggle("open");
  arrow.textContent = a.classList.contains("open") ? "▲" : "▼";
}

// ===================== NOTIFICATIONS =====================
async function loadNotifCount(panel) {
  try {
    const res = await fetch(`${API_URL}/notifications/unread`,{headers:headers()});
    const data = await res.json();
    const badge = document.getElementById(panel==="admin"?"adminNotifBadge":"userNotifBadge");
    if (badge) {
      badge.textContent = data.count;
      badge.classList.toggle("hidden", data.count <= 0);
    }
  } catch{}
}

async function openNotifications() {
  showEl("notifPanel");
  showEl("notifOverlay");
  try {
    const res = await fetch(`${API_URL}/notifications`,{headers:headers()});
    const notifs = await res.json();
    document.getElementById("notifList").innerHTML = notifs.length ? notifs.map(n=>`
      <div class="notif-item ${n.isRead?'':'unread'} ${n.type}">
        <h4>${n.title}</h4>
        <p>${n.message}</p>
        <div class="notif-time">${fmtDate(n.createdAt)}</div>
      </div>`).join("") : `<div class="empty" style="padding:30px"><div class="ei">🔔</div><p>No notifications</p></div>`;
  } catch{}
}

function closeNotifications() {
  hideEl("notifPanel");
  hideEl("notifOverlay");
}

async function markAllRead() {
  await fetch(`${API_URL}/notifications/read`,{method:"PUT",headers:headers()});
  openNotifications();
  const u = currentUser;
  if (u?.isAdmin) loadNotifCount("admin");
  else loadNotifCount("user");
}

// Poll notifications every 30s
setInterval(() => {
  if (token()) {
    const isAdmin = localStorage.getItem("role")==="admin";
    loadNotifCount(isAdmin?"admin":"user");
  }
}, 30000);

// ===================== INIT =====================
window.onload = async () => {
  initLoginPage();

  if (!token()) return;

  try {
    const res = await fetch(`${API_URL}/auth/profile`, { headers: headers() });
    if (!res.ok) {
      localStorage.clear();
      return;
    }

    const profile = await res.json();
    currentUser = profile;

    if (profile.role === "admin" || localStorage.getItem("role") === "admin") {
      showPage("adminPage");
      initAdmin();
    } else {
      showPage("userPage");
      initUser(profile);
    }
  } catch {
    localStorage.clear();
  }
};
