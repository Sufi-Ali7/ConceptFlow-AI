/*
  ConceptFlow AI — FULL CLEAN FINAL ROUTER
  Single frontend controller loaded last.
  Handles: auth, admin, logout, study tools, payment, cards, nav, chat.
*/
(() => {
  const $ = (id) => document.getElementById(id);

  const state = {
    initialized: false
  };

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, c => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    }[c]));
  }

  function token() {
    return localStorage.getItem("cf_token") || localStorage.getItem("token") || "";
  }

  function getUser() {
    try { return JSON.parse(localStorage.getItem("cf_user") || "{}"); } catch { return {}; }
  }

  function saveAuth(data) {
    if (data?.token) {
      localStorage.setItem("cf_token", data.token);
      localStorage.setItem("token", data.token);
    }
    if (data?.user) {
      localStorage.setItem("cf_user", JSON.stringify(data.user));
    }
    updateHeaderUser();
  }

  function clearAuth() {
    localStorage.removeItem("cf_token");
    localStorage.removeItem("token");
    localStorage.removeItem("cf_user");
    localStorage.removeItem("adminLoggedIn");
  }

  function toast(msg) {
    let el = $("cfToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "cfToast";
      el.className = "cf-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2200);
  }

  function modal(html, wide = false) {
    let m = $("cfModal");
    if (!m) {
      m = document.createElement("div");
      m.id = "cfModal";
      m.className = "cf-modal";
      document.body.appendChild(m);
    }
    m.innerHTML = `<div class="cf-modal-box ${wide ? "wide" : ""}">
      <button class="cf-modal-close" type="button">×</button>
      ${html}
    </div>`;
    m.classList.add("show");
  }

  function closeModal() {
    $("cfModal")?.classList.remove("show");
  }

  function go(hash) {
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function md(text) {
    return esc(text)
      .replace(/^### (.*)$/gm, "<h3>$1</h3>")
      .replace(/^## (.*)$/gm, "<h2>$1</h2>")
      .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
      .replace(/\n/g, "<br>");
  }

  function addChat(role, text) {
    const box = $("chatMessages") || document.querySelector(".chat-messages");
    if (!box) return;
    const div = document.createElement("div");
    div.className = "chat-message " + (role === "user" ? "user" : "ai");
    div.innerHTML = role === "user"
      ? `<b>You</b><div class="message-content"><p>${esc(text)}</p></div>`
      : `<b>ConceptFlow AI</b><div class="message-content">${md(text)}</div>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  function fallbackAnswer(q) {
    return `## ${q}

### 1. Short Definition
This topic can be understood by definition, working, example and real use case.

### 2. Working
Break the topic into smaller steps, understand the logic, then dry run using an example.

### 3. Exam / Viva Points
- Definition
- Working
- Example
- Advantages
- Common mistakes
- Real use case

### 4. Note
If Gemini key is valid, response comes from real AI. Otherwise fallback mode is used.`;
  }

  async function sendAI(text) {
    const input = $("proChatInput");
    const q = String(text || input?.value || "").trim();
    if (!q) return toast("Question type karo");
    if (input) input.value = "";

    go("#proChat");
    addChat("user", q);

    try {
      const res = await fetch("/api/ai/solve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token() ? { Authorization: "Bearer " + token() } : {})
        },
        body: JSON.stringify({ question: q })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "AI route error");
      addChat("ai", data.answer || fallbackAnswer(q));
    } catch (err) {
      addChat("ai", fallbackAnswer(q) + `\n\n### Fallback Reason\n${err.message}`);
    }
  }

  window.sendProChat = sendAI;

  function loginModal(admin = false) {
    modal(`
      <h2>${admin ? "Admin Login" : "Login / Signup"}</h2>
      <p>${admin ? "Use ADMIN_EMAIL and ADMIN_PASSWORD from .env." : "Login required for history, progress and premium."}</p>
      ${admin ? "" : `<input id="cfName" placeholder="Name" value="${esc(getUser().name || "")}">`}
      <input id="cfEmail" placeholder="${admin ? "Admin email" : "Email"}" value="${esc(admin ? "admin@conceptflow.ai" : (getUser().email || ""))}">
      <input id="cfPassword" type="password" placeholder="${admin ? "Admin password" : "Password"}" value="${admin ? "Admin@12345" : ""}">
      <div class="cf-modal-actions">
        ${admin ? "" : '<button id="cfSignupBtn" type="button">Signup</button>'}
        <button id="${admin ? "cfAdminLoginBtn" : "cfLoginBtn"}" type="button">${admin ? "Login Admin" : "Login"}</button>
      </div>
      <p id="cfAuthMsg"></p>
    `);
  }

  async function auth(mode, admin = false, credentials = null) {
    const msg = $("cfAuthMsg") || $("adminLoginMsg");
    const payload = credentials || {
      name: $("cfName")?.value || "Student",
      email: $("cfEmail")?.value || "",
      password: $("cfPassword")?.value || ""
    };

    if (!payload.email || !payload.password) {
      if (msg) msg.textContent = "Email and password required.";
      return;
    }

    try {
      const res = await fetch("/api/auth/" + (mode || "login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Login/signup failed");
      if (admin && data.user?.role !== "admin") {
        throw new Error("This account is not admin. Use ADMIN_EMAIL from .env and run npm run seed.");
      }

      saveAuth(data);

      if (msg) msg.textContent = admin ? "Admin login successful." : "Login successful.";
      toast(admin ? "Admin login successful" : "Login successful");

      closeModal();

      if (admin) {
        setTimeout(loadAdminPanel, 400);
      }
    } catch (err) {
      if (msg) msg.textContent = err.message;
    }
  }

  async function api(path, options = {}) {
    const res = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token() ? { Authorization: "Bearer " + token() } : {}),
        ...(options.headers || {})
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "API error");
    return data;
  }

  async function loadAdminPanel() {
    const msg = $("adminLoginMsg");
    try {
      if (!token()) {
        if (msg) msg.textContent = "Admin login required.";
        return loginModal(true);
      }

      const me = await api("/api/admin/me");
      if (!me?.ok && me?.admin?.role !== "admin") {
        throw new Error("Admin access required");
      }

      const stats = await api("/api/admin/stats");
      const users = await api("/api/admin/users");

      renderAdminStats(stats);
      renderAdminUsers(users);
      if (msg) msg.textContent = "Admin data loaded.";
    } catch (err) {
      if (msg) msg.textContent = err.message;
      loginModal(true);
    }
  }

  function renderAdminStats(stats) {
    const box = $("adminStatsBox");
    if (!box) return;

    box.innerHTML = `
      <div class="admin-stat-pill"><span>Users</span><b>${stats.users ?? 0}</b></div>
      <div class="admin-stat-pill"><span>Premium Users</span><b>${stats.premiumUsers ?? 0}</b></div>
      <div class="admin-stat-pill"><span>AI Questions</span><b>${stats.aiQuestions ?? 0}</b></div>
      <div class="admin-stat-pill"><span>Payments</span><b>${stats.payments ?? 0}</b></div>
      <div class="admin-stat-pill"><span>Study Materials</span><b>${stats.materials ?? 0}</b></div>
    `;
  }

  function renderAdminUsers(users) {
    const panel = $("adminLivePanel");
    if (!panel) return;

    panel.innerHTML = `
      <div class="admin-toolbar-clean">
        <button id="adminRefreshBtn" type="button">Refresh Admin Data</button>
        <button id="adminPaymentsBtn" type="button">View Payments</button>
        <button id="adminHistoryBtn" type="button">View AI History</button>
      </div>

      <div class="admin-table-wrap-clean">
        <table class="admin-table-clean">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Role</th><th>Plan</th><th>Questions</th><th>Created</th>
            </tr>
          </thead>
          <tbody>
            ${(users || []).map(u => `
              <tr>
                <td>${esc(u.name || "")}</td>
                <td>${esc(u.email || "")}</td>
                <td>${esc(u.role || "")}</td>
                <td>${esc(u.plan || "")}</td>
                <td>${esc(u.questionsAsked ?? 0)}</td>
                <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ""}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  async function showAdminList(type) {
    try {
      const endpoint = type === "payments" ? "/api/admin/payments" : "/api/admin/ai-history";
      const data = await api(endpoint);
      modal(`
        <h2>${type === "payments" ? "Payments" : "AI History"}</h2>
        <div class="admin-table-wrap-clean">
          <table class="admin-table-clean">
            <tbody>
              ${(data || []).map(item => `
                <tr>
                  <td>${esc(item.userId?.email || item.userId?.name || "Guest")}</td>
                  <td>${esc(item.status || item.provider || "")}</td>
                  <td>${esc(item.amount || item.question || "")}</td>
                  <td>${item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `, true);
    } catch (err) {
      modal(`<h2>Admin Error</h2><p>${esc(err.message)}</p>`);
    }
  }

  function logout() {
    clearAuth();
    toast("Logged out successfully");
    setTimeout(() => location.reload(), 650);
  }

  function updateHeaderUser() {
    const u = getUser();
    const logged = Boolean(token() && (u.email || u.name));

    const existing = document.querySelector(".user-menu-wrap-final");
    if (!logged) {
      if (existing) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "login-btn";
        btn.textContent = "Login";
        existing.replaceWith(btn);
      }
      return;
    }

    if (existing) {
      const btn = existing.querySelector(".user-menu-btn-final");
      const info = existing.querySelector(".user-info-final");
      if (btn) btn.textContent = (u.name || u.email || "User").split("@")[0];
      if (info) info.innerHTML = `<b>${esc(u.name || "User")}</b><br><small>${esc(u.email || "")}</small><br><small>Role: ${esc(u.role || "student")}</small>`;
      return;
    }

    const candidates = [...document.querySelectorAll("button,a")];
    const loginBtn = candidates.find(el => {
      const t = (el.textContent || "").trim().toLowerCase();
      return t === "login" || t === "signup" || t === "saif" || t === "sufi" || t === "user" || t.includes("@");
    });

    if (!loginBtn) return;

    const wrap = document.createElement("div");
    wrap.className = "user-menu-wrap-final";
    wrap.innerHTML = `
      <button class="user-menu-btn-final" type="button">${esc((u.name || u.email || "User").split("@")[0])}</button>
      <div class="user-dropdown-final">
        <div class="user-info-final">
          <b>${esc(u.name || "User")}</b><br>
          <small>${esc(u.email || "")}</small><br>
          <small>Role: ${esc(u.role || "student")}</small>
        </div>
        <button type="button" data-user-action="dashboard">Dashboard</button>
        <button type="button" data-user-action="history">AI History</button>
        <button type="button" data-user-action="logout" class="logout-danger-final">Logout User</button>
      </div>
    `;

    loginBtn.replaceWith(wrap);
  }

  function studyPrompt(type) {
    const prompts = {
      notes: "Create short but deep exam notes for my syllabus/topic. Format: definition, explanation, example, diagram idea, important points, final revision.",
      questions: "Generate expected exam questions: 1 mark, 2.5 mark and 5 mark questions with answers.",
      viva: "Generate viva questions and short exact answers for my topic. Keep answers easy to memorize.",
      revision: "Create a 3 to 7 day revision plan for exam preparation with daily tasks."
    };
    sendAI(prompts[type] || prompts.notes);
  }

  async function handleStudyUpload() {
    const fileInput = document.querySelector('input[type="file"]');
    if (!fileInput || !fileInput.files?.[0]) {
      toast("Pehle file choose karo");
      return;
    }

    const file = fileInput.files[0];
    let text = "";
    try {
      if (file.type.includes("text") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        text = await file.text();
      } else {
        text = `File uploaded: ${file.name}. Create notes based on this syllabus/study material.`;
      }

      sendAI(`Create exam notes, expected questions, viva Q&A and revision plan from this material:\n\n${text.slice(0, 6000)}`);
    } catch (err) {
      toast("File read failed: " + err.message);
    }
  }

  async function startPayment() {
    if (!token()) {
      toast("Payment ke liye pehle login karo");
      return loginModal(false);
    }

    try {
      const res = await fetch("/api/billing/create-order", {
        method: "POST",
        headers: { Authorization: "Bearer " + token() }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Payment route error");

      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = resolve;
          s.onerror = reject;
          document.body.appendChild(s);
        });
      }

      new window.Razorpay({
        key: data.key,
        amount: data.amount || data.order?.amount,
        currency: data.currency || "INR",
        name: "ConceptFlow AI",
        description: "Premium Plan",
        order_id: data.order?.id,
        handler: async (response) => {
          const verified = await api("/api/billing/verify", {
            method: "POST",
            body: JSON.stringify(response)
          });
          if (verified.user) {
            localStorage.setItem("cf_user", JSON.stringify(verified.user));
            updateHeaderUser();
          }
          modal("<h2>Premium Activated ✅</h2><p>Your premium plan is active.</p>");
        }
      }).open();
    } catch (err) {
      modal(`
        <h2>Payment Setup Needed</h2>
        <p>${esc(err.message)}</p>
        <ul>
          <li>Restart server after editing .env.</li>
          <li>Login first.</li>
          <li>Check <code>/api/billing/debug</code>.</li>
          <li>Use valid Razorpay test keys.</li>
        </ul>
      `);
    }
  }

  function contactModal() {
    modal(`
      <h2>Contact Support</h2>
      <p>This demo opens AI support. SMTP/contact backend can be connected later.</p>
      <button class="cf-primary-btn" type="button" id="askSupportBtn">Ask AI Support</button>
    `);
  }

  function adminLoginFromPage() {
    const email = $("adminEmail")?.value || "";
    const password = $("adminPassword")?.value || "";
    auth("login", true, { email, password, name: "Admin" });
  }

  function handleClick(e) {
    if (e.target.closest("input,textarea,select")) return;

    const target = e.target.closest("a,button,.subject-card,.language-pro-card,.course-card,.feature-clickable,.feature-card,.feature-item,.feature-box,.trust-grid article,.pricing-card");
    if (!target) return;

    const txt = (target.textContent || "").trim();
    const low = txt.toLowerCase();
    const href = target.getAttribute?.("href");

    if (target.classList.contains("cf-modal-close")) {
      e.preventDefault(); e.stopPropagation(); closeModal(); return;
    }

    if (target.classList.contains("user-menu-btn-final")) {
      e.preventDefault(); e.stopPropagation();
      target.parentElement.querySelector(".user-dropdown-final")?.classList.toggle("show");
      return;
    }

    const userAction = target.getAttribute("data-user-action");
    if (userAction) {
      e.preventDefault(); e.stopPropagation();
      if (userAction === "logout") return logout();
      if (userAction === "dashboard") return go("#dashboard");
      if (userAction === "history") return go("#proChat");
    }

    if (target.id === "cfSignupBtn") { e.preventDefault(); e.stopPropagation(); auth("signup"); return; }
    if (target.id === "cfLoginBtn") { e.preventDefault(); e.stopPropagation(); auth("login"); return; }
    if (target.id === "cfAdminLoginBtn") { e.preventDefault(); e.stopPropagation(); auth("login", true); return; }
    if (target.id === "adminLoginBtn") { e.preventDefault(); e.stopPropagation(); adminLoginFromPage(); return; }
    if (target.id === "adminLogoutBtn" || low.includes("logout admin")) { e.preventDefault(); e.stopPropagation(); logout(); return; }
    if (target.id === "adminRefreshBtn") { e.preventDefault(); e.stopPropagation(); loadAdminPanel(); return; }
    if (target.id === "adminPaymentsBtn") { e.preventDefault(); e.stopPropagation(); showAdminList("payments"); return; }
    if (target.id === "adminHistoryBtn") { e.preventDefault(); e.stopPropagation(); showAdminList("history"); return; }
    if (target.id === "askSupportBtn") { e.preventDefault(); e.stopPropagation(); closeModal(); sendAI("Write a professional support request for ConceptFlow AI."); return; }

    if (href && href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) { e.preventDefault(); e.stopPropagation(); go(href); return; }
    }

    if (target.id === "sendProChatBtn" || low === "send") {
      e.preventDefault(); e.stopPropagation(); sendAI(); return;
    }

    if (low === "admin" || low.includes("admin dashboard")) {
      e.preventDefault(); e.stopPropagation(); go("#admin"); return;
    }

    if (low.includes("login") || low.includes("signup")) {
      e.preventDefault(); e.stopPropagation(); loginModal(false); return;
    }

    if (low.includes("generate notes")) { e.preventDefault(); e.stopPropagation(); studyPrompt("notes"); return; }
    if (low.includes("generate questions")) { e.preventDefault(); e.stopPropagation(); studyPrompt("questions"); return; }
    if (low.includes("generate viva")) { e.preventDefault(); e.stopPropagation(); studyPrompt("viva"); return; }
    if (low.includes("create plan")) { e.preventDefault(); e.stopPropagation(); studyPrompt("revision"); return; }
    if (low.includes("upload") || low.includes("my materials")) {
      e.preventDefault(); e.stopPropagation(); handleStudyUpload(); return;
    }

    if (low.includes("upgrade") || low.includes("razorpay")) {
      e.preventDefault(); e.stopPropagation(); startPayment(); return;
    }

    if (low.includes("contact")) {
      e.preventDefault(); e.stopPropagation(); contactModal(); return;
    }

    if (low.includes("get started")) {
      e.preventDefault(); e.stopPropagation(); go("#proChat"); setTimeout(() => $("proChatInput")?.focus(), 300); return;
    }

    if (low.includes("more subjects") || low.includes("view all subjects")) {
      e.preventDefault(); e.stopPropagation(); go("#allLanguages"); return;
    }

    if (low.includes("dsa engine") || low.includes("animated visualizer") || low.includes("code dry run")) {
      e.preventDefault(); e.stopPropagation(); go("#dsaEngine"); return;
    }

    if (low.includes("practice quiz")) {
      e.preventDefault(); e.stopPropagation(); sendAI("Generate 10 MCQ quiz questions with answers and explanations for DSA, DBMS and OS."); return;
    }

    if (target.matches(".subject-card,.language-pro-card,.course-card")) {
      e.preventDefault(); e.stopPropagation();
      const title = target.querySelector("h3")?.textContent || txt;
      sendAI(`Teach me ${title} from basics with examples, roadmap, quiz, interview questions and project use cases.`);
      return;
    }

    if (target.matches(".trust-grid article")) {
      e.preventDefault(); e.stopPropagation();
      const title = target.querySelector("h3")?.textContent || txt;
      sendAI(`Explain how ConceptFlow AI helps students with ${title}.`);
      return;
    }
  }

  function bindEnter() {
    const input = $("proChatInput");
    if (input && !input.dataset.finalCleanBound) {
      input.dataset.finalCleanBound = "1";
      input.addEventListener("keydown", e => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendAI();
        }
      });
    }
  }

  function init() {
    if (state.initialized) return;
    state.initialized = true;
    document.addEventListener("click", handleClick, true);
    bindEnter();
    updateHeaderUser();
  }

  document.addEventListener("DOMContentLoaded", init);
  setTimeout(init, 500);
})();


/* Admin real final small override */
document.addEventListener("DOMContentLoaded", () => {
  const email = document.getElementById("adminEmail");
  const pass = document.getElementById("adminPassword");
  if (email && (!email.value || email.value.includes("sufi") || email.value.includes("saif"))) {
    email.value = "admin@conceptflow.ai";
  }
  if (pass && !pass.value) {
    pass.value = "Admin@12345";
  }
});


/* Pricing final clean handlers */
async function refreshPlanFinalClean(){
  const text = document.getElementById("currentPlanText");
  const usage = document.getElementById("currentUsageText");
  const token = localStorage.getItem("cf_token") || localStorage.getItem("token") || "";
  if(!token){
    if(text) text.textContent = "Login to check plan.";
    if(usage) usage.textContent = "Usage will appear here.";
    return;
  }
  try{
    const res = await fetch("/api/billing/status", { headers: { Authorization: "Bearer " + token }});
    const data = await res.json();
    if(!res.ok) throw new Error(data.message || "Status failed");
    if(text) text.textContent = data.premium ? "Premium active" : "Free plan";
    if(usage) usage.textContent = data.premiumUntil ? ("Premium until: " + new Date(data.premiumUntil).toLocaleDateString()) : "Free usage limits apply.";
  }catch(e){
    if(text) text.textContent = e.message;
  }
}
document.addEventListener("click", (e) => {
  const target = e.target.closest("#checkPlanBtn,#refreshPlanBtn");
  if(target){
    e.preventDefault();
    e.stopPropagation();
    refreshPlanFinalClean();
  }
}, true);
document.addEventListener("DOMContentLoaded", refreshPlanFinalClean);


/* No duplicate final study/pricing direct handlers */
function studyActionNoDuplicateFinal(action){
  const prompts = {
    notes: "Create short but deep exam notes for my topic/syllabus with definition, explanation, example, important points and revision summary.",
    questions: "Generate expected exam questions with answers: 1 mark, 2.5 mark and 5 mark.",
    viva: "Generate viva questions and short exact answers topic-wise.",
    revision: "Create a 3 to 7 day revision plan for exam preparation."
  };
  if(window.sendProChat) window.sendProChat(prompts[action] || prompts.notes);
}
document.addEventListener("click", async (e) => {
  const studyBtn = e.target.closest("[data-study-action]");
  if(studyBtn){
    e.preventDefault();
    e.stopPropagation();
    studyActionNoDuplicateFinal(studyBtn.dataset.studyAction);
    return;
  }
  const upload = e.target.closest("#uploadSyllabusBtn,#myMaterialsBtn");
  if(upload){
    e.preventDefault();
    e.stopPropagation();
    const file = document.getElementById("studyFileInput")?.files?.[0];
    if(!file){
      if(window.sendProChat) window.sendProChat("Create exam notes, expected questions, viva questions and revision plan for my syllabus/topic.");
      return;
    }
    let text = "";
    try{
      if(file.type.includes("text") || file.name.endsWith(".txt") || file.name.endsWith(".md")){
        text = await file.text();
      }else{
        text = "Uploaded file: " + file.name;
      }
      if(window.sendProChat) window.sendProChat("Create exam notes, expected questions, viva questions and revision plan from this material:\\n\\n" + text.slice(0,6000));
    }catch(err){
      if(window.sendProChat) window.sendProChat("Create notes for uploaded syllabus file: " + file.name);
    }
  }
}, true);


/* =========================================================
   DASHBOARD FINAL REAL HANDLERS
   ========================================================= */
(() => {
  function $(id){ return document.getElementById(id); }

  function token(){
    return localStorage.getItem("cf_token") || localStorage.getItem("token") || "";
  }

  function user(){
    try { return JSON.parse(localStorage.getItem("cf_user") || "{}"); } catch { return {}; }
  }

  function esc(s){
    return String(s || "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));
  }

  function toast(msg){
    let el = $("cfToast");
    if(!el){
      el = document.createElement("div");
      el.id = "cfToast";
      el.className = "cf-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2200);
  }

  async function api(path, options = {}){
    const res = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token() ? { Authorization: "Bearer " + token() } : {}),
        ...(options.headers || {})
      }
    });
    const data = await res.json().catch(() => ({}));
    if(!res.ok) throw new Error(data.message || "API error");
    return data;
  }

  function findDashboard(){
    return document.querySelector("#dashboard") || document.querySelector('[id*="dashboard" i]');
  }

  function findCardByTitle(title){
    const dash = findDashboard();
    if(!dash) return null;
    const cards = [...dash.querySelectorAll("article,.card,.dashboard-card,.glass-card")];
    return cards.find(card => (card.textContent || "").toLowerCase().includes(title.toLowerCase()));
  }

  function setCardHTML(title, html){
    const card = findCardByTitle(title);
    if(card) card.innerHTML = html;
  }

  function ensureProgressBar(percent){
    return `<div class="dashboard-progress-bar-clean">
      <div class="dashboard-progress-fill-clean" style="width:${Math.max(0, Math.min(100, percent || 0))}%"></div>
    </div>`;
  }

  async function loadDashboardFinal(){
    const dash = findDashboard();
    if(!dash) return;

    const u = user();
    const logged = Boolean(token() && (u.email || u.name));

    // Student Profile
    setCardHTML("Student Profile", `
      <h3>👤 Student Profile</h3>
      <p>${logged ? esc(u.name || "Student") : "Guest Student"}</p>
      <p>${logged ? esc(u.email || "") : "Login to save progress and history."}</p>
      <div class="dashboard-action-row">
        <button type="button" data-dashboard-action="${logged ? "logout" : "login"}">${logged ? "Logout" : "Login / Signup"}</button>
      </div>
    `);

    if(!logged){
      setCardHTML("Progress", `
        <h3>📈 Progress</h3>
        ${ensureProgressBar(0)}
        <p>Login to track progress.</p>
        <div class="dashboard-action-row"><button type="button" data-dashboard-action="login">Login</button></div>
      `);
      setCardHTML("Weak Topics", `
        <h3>🎯 Weak Topics</h3>
        <ul class="dashboard-mini-list"><li>Login to detect weak topics.</li></ul>
      `);
      setCardHTML("AI Status", `
        <h3>🤖 AI Status</h3>
        <p>Click Check AI to verify provider.</p>
        <div class="dashboard-action-row"><button type="button" data-dashboard-action="check-ai">Check AI</button></div>
      `);
      return;
    }

    try{
      const progress = await api("/api/progress");
      const percent = progress.percent || 0;
      setCardHTML("Progress", `
        <h3>📈 Progress</h3>
        ${ensureProgressBar(percent)}
        <p>${progress.completed || 0}/${progress.total || 0} topics completed (${percent}%).</p>
        <div class="dashboard-action-row">
          <button type="button" data-dashboard-action="refresh-progress">Refresh Progress</button>
          <button type="button" data-dashboard-action="mark-demo-progress">Mark Demo Topic</button>
        </div>
      `);
    }catch(err){
      setCardHTML("Progress", `
        <h3>📈 Progress</h3>
        ${ensureProgressBar(0)}
        <p class="dashboard-status-bad">${esc(err.message)}</p>
      `);
    }

    try{
      const me = await api("/api/auth/me");
      const topics = me.user?.weakTopics || u.weakTopics || [];
      setCardHTML("Weak Topics", `
        <h3>🎯 Weak Topics</h3>
        <ul class="dashboard-mini-list">
          ${topics.length ? topics.map(t => `<li>${esc(t)}</li>`).join("") : "<li>No weak topics detected yet.</li>"}
        </ul>
        <div class="dashboard-action-row">
          <button type="button" data-dashboard-action="detect-weak">Detect Weak Topics</button>
        </div>
      `);
    }catch(err){
      setCardHTML("Weak Topics", `
        <h3>🎯 Weak Topics</h3>
        <ul class="dashboard-mini-list"><li>${esc(err.message)}</li></ul>
      `);
    }

    await checkAIStatus(false);

    try{
      const history = await api("/api/ai/history");
      setCardHTML("Recent AI History", `
        <h3>🕘 Recent AI History</h3>
        <ul class="dashboard-mini-list">
          ${history.length ? history.slice(0,5).map(h => `<li>${esc(h.question).slice(0,80)}</li>`).join("") : "<li>No saved AI questions yet.</li>"}
        </ul>
        <div class="dashboard-action-row">
          <button type="button" data-dashboard-action="go-chat">Open AI Chat</button>
        </div>
      `);
    }catch(err){
      setCardHTML("Recent AI History", `
        <h3>🕘 Recent AI History</h3>
        <p>${esc(err.message)}</p>
      `);
    }
  }

  async function checkAIStatus(showToast = true){
    try{
      const data = await api("/api/ai/test");
      setCardHTML("AI Status", `
        <h3>🤖 AI Status</h3>
        <p class="dashboard-status-good">Connected: ${esc(data.provider || "AI")}.</p>
        <p>Model: ${esc(data.model || "configured")}</p>
        <div class="dashboard-action-row"><button type="button" data-dashboard-action="check-ai">Check AI</button></div>
      `);
      if(showToast) toast("AI connected");
    }catch(err){
      setCardHTML("AI Status", `
        <h3>🤖 AI Status</h3>
        <p class="dashboard-status-bad">AI check failed: ${esc(err.message)}</p>
        <div class="dashboard-action-row"><button type="button" data-dashboard-action="check-ai">Check AI</button></div>
      `);
    }
  }

  async function markDemoProgress(){
    if(!token()) return toast("Pehle login karo");
    try{
      await api("/api/progress", {
        method: "POST",
        body: JSON.stringify({
          course: "DSA Mastery",
          topic: "Binary Search",
          completed: true,
          score: 100
        })
      });
      toast("Demo progress saved");
      loadDashboardFinal();
    }catch(err){
      toast(err.message);
    }
  }

  function openLogin(){
    const loginBtn = [...document.querySelectorAll("button,a")].find(el => {
      const t = (el.textContent || "").trim().toLowerCase();
      return t === "login" || t.includes("login / signup");
    });
    if(loginBtn) loginBtn.click();
  }

  function logout(){
    localStorage.removeItem("cf_token");
    localStorage.removeItem("token");
    localStorage.removeItem("cf_user");
    toast("Logged out");
    setTimeout(() => location.reload(), 600);
  }

  document.addEventListener("click", (e) => {
    const target = e.target.closest("[data-dashboard-action], #dashboard button, #dashboard a");
    if(!target) return;

    const action = target.dataset.dashboardAction;
    const text = (target.textContent || "").toLowerCase();

    if(action || text.includes("refresh progress") || text.includes("check ai")){
      e.preventDefault();
      e.stopPropagation();
    }

    if(action === "login") return openLogin();
    if(action === "logout") return logout();
    if(action === "check-ai" || text.includes("check ai")) return checkAIStatus(true);
    if(action === "refresh-progress" || text.includes("refresh progress")) return loadDashboardFinal();
    if(action === "mark-demo-progress") return markDemoProgress();
    if(action === "detect-weak"){
      if(window.sendProChat) window.sendProChat("Detect my weak topics from my recent learning history and suggest what I should revise next.");
      return;
    }
    if(action === "go-chat"){
      const el = document.querySelector("#proChat");
      if(el) el.scrollIntoView({ behavior:"smooth", block:"start" });
      return;
    }
  }, true);

  document.addEventListener("DOMContentLoaded", loadDashboardFinal);
  setTimeout(loadDashboardFinal, 700);

  window.loadDashboardFinal = loadDashboardFinal;
})();
