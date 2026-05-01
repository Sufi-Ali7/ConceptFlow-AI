/*
  ConceptFlow AI — Final Study/Admin/Header Repair Router
  Loaded last to override older duplicated click handlers safely.
*/
(() => {
  const $ = (id) => document.getElementById(id);

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));
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
    setTimeout(() => el.classList.remove("show"), 2300);
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

  function token() {
    return localStorage.getItem("cf_token") || localStorage.getItem("token") || "";
  }

  function saveAuth(data) {
    if (data.token) {
      localStorage.setItem("cf_token", data.token);
      localStorage.setItem("token", data.token);
    }
    if (data.user) localStorage.setItem("cf_user", JSON.stringify(data.user));
    updateUserUI();
  }

  function user() {
    try { return JSON.parse(localStorage.getItem("cf_user") || "{}"); } catch { return {}; }
  }

  function updateUserUI() {
    const u = user();
    const name = u.name || u.email || "";
    if (!name) return;
    document.querySelectorAll("button,a").forEach(el => {
      const t = (el.textContent || "").trim().toLowerCase();
      if (t === "login" || t === "signup" || t === "saif") {
        el.textContent = name.split("@")[0] || "User";
      }
    });
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

### 1. Short Notes
This feature uses ConceptFlow AI to generate study material.

### 2. What you should write
- Definition
- Explanation
- Example
- Important points
- Viva/interview questions
- Common mistakes

### 3. Production Note
If Gemini key is active, answer comes from real AI. Otherwise fallback mode gives safe structured output.`;
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
      <input id="cfName" placeholder="Name" value="${esc(user().name || "")}" ${admin ? 'style="display:none"' : ""}>
      <input id="cfEmail" placeholder="Email" value="${esc(admin ? "" : (user().email || ""))}">
      <input id="cfPassword" type="password" placeholder="Password">
      <div class="cf-modal-actions">
        ${admin ? "" : '<button id="cfSignupBtn" type="button">Signup</button>'}
        <button id="${admin ? "cfAdminLoginBtn" : "cfLoginBtn"}" type="button">${admin ? "Login Admin" : "Login"}</button>
      </div>
      <p id="cfAuthMsg"></p>
    `);
  }

  async function auth(mode, admin = false) {
    const msg = $("cfAuthMsg");
    const payload = {
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
      if (admin && data.user?.role !== "admin") throw new Error("This account is not admin. Use ADMIN_EMAIL from .env.");

      saveAuth(data);
      if (msg) msg.textContent = "Login successful.";
      toast(admin ? "Admin login successful" : "Login successful");
      setTimeout(closeModal, 700);

      if (admin) setTimeout(loadAdminPanel, 900);
    } catch (err) {
      if (msg) msg.textContent = err.message;
    }
  }

  // Study tools
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
    const result = ensureStudyResult();
    result.innerHTML = `<b>${esc(file.name)}</b> selected. Reading file...`;

    let text = "";
    try {
      if (file.type.includes("text") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        text = await file.text();
      } else {
        text = `File uploaded: ${file.name}. Please create notes based on the syllabus/topic in this file.`;
      }

      result.innerHTML = `<b>${esc(file.name)}</b> ready. Sending to AI...`;
      sendAI(`Create exam notes, expected questions, viva Q&A and revision plan from this material:\n\n${text.slice(0, 6000)}`);
    } catch (err) {
      result.innerHTML = `Could not read file: ${esc(err.message)}`;
    }
  }

  function ensureStudyResult() {
    let sec = document.querySelector("#study") || document.querySelector('[id*="study" i]') || document.body;
    let box = $("studyResultBox");
    if (!box) {
      box = document.createElement("div");
      box.id = "studyResultBox";
      box.className = "study-result-box";
      sec.appendChild(box);
    }
    return box;
  }

  // Admin
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
    try {
      if (!token()) return loginModal(true);
      const me = await api("/api/admin/me");
      if (!me.ok) throw new Error("Admin login required");

      const stats = await api("/api/admin/stats");
      const users = await api("/api/admin/users");

      renderAdminData(stats, users);
      toast("Admin data loaded");
    } catch (err) {
      loginModal(true);
      const msg = $("cfAuthMsg");
      if (msg) msg.textContent = err.message;
    }
  }

  function renderAdminData(stats, users) {
    const adminSec = document.querySelector("#admin") || document.querySelector('[id*="admin" i]') || document.body;
    let panel = $("adminLivePanel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "adminLivePanel";
      panel.className = "admin-live-panel";
      adminSec.appendChild(panel);
    }

    panel.innerHTML = `
      <div class="admin-result-box">
        <h3>Live Admin Stats</h3>
        <p><b>Users:</b> ${stats.users ?? 0}</p>
        <p><b>Premium Users:</b> ${stats.premiumUsers ?? 0}</p>
        <p><b>AI Questions:</b> ${stats.aiQuestions ?? 0}</p>
        <p><b>Payments:</b> ${stats.payments ?? 0}</p>
        <p><b>Study Materials:</b> ${stats.materials ?? 0}</p>
      </div>
      <div class="admin-toolbar">
        <button id="adminRefreshBtn" type="button">Refresh Admin Data</button>
        <button id="adminPaymentsBtn" type="button">View Payments</button>
        <button id="adminHistoryBtn" type="button">View AI History</button>
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Plan</th><th>Questions</th><th>Created</th></tr>
          </thead>
          <tbody>
            ${(users || []).map(u => `
              <tr>
                <td>${esc(u.name)}</td>
                <td>${esc(u.email)}</td>
                <td>${esc(u.role)}</td>
                <td>${esc(u.plan)}</td>
                <td>${esc(u.questionsAsked)}</td>
                <td>${new Date(u.createdAt).toLocaleDateString()}</td>
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
        <div class="admin-table-wrap">
          <table class="admin-table">
            <tbody>
              ${(data || []).map(item => `
                <tr>
                  <td>${esc(item.userId?.email || item.userId?.name || "Guest")}</td>
                  <td>${esc(item.status || item.provider || "")}</td>
                  <td>${esc(item.amount || item.question || "")}</td>
                  <td>${new Date(item.createdAt).toLocaleString()}</td>
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

  // Payments
  async function startPayment() {
    if (!token()) {
      toast("Payment ke liye pehle login karo");
      loginModal(false);
      return;
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
          if (verified.user) localStorage.setItem("cf_user", JSON.stringify(verified.user));
          modal("<h2>Premium Activated ✅</h2><p>Your premium plan is active.</p>");
        }
      }).open();
    } catch (err) {
      modal(`
        <h2>Payment Setup Needed</h2>
        <p>${esc(err.message)}</p>
        <ul class="payment-help-list">
          <li>Use latest repaired folder.</li>
          <li>Restart server after editing .env.</li>
          <li>Login first.</li>
          <li>Check <code>/api/billing/debug</code>.</li>
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

    if (target.id === "cfSignupBtn") { e.preventDefault(); e.stopPropagation(); auth("signup"); return; }
    if (target.id === "cfLoginBtn") { e.preventDefault(); e.stopPropagation(); auth("login"); return; }
    if (target.id === "cfAdminLoginBtn") { e.preventDefault(); e.stopPropagation(); auth("login", true); return; }
    if (target.id === "adminRefreshBtn") { e.preventDefault(); e.stopPropagation(); loadAdminPanel(); return; }
    if (target.id === "adminPaymentsBtn") { e.preventDefault(); e.stopPropagation(); showAdminList("payments"); return; }
    if (target.id === "adminHistoryBtn") { e.preventDefault(); e.stopPropagation(); showAdminList("history"); return; }
    if (target.id === "askSupportBtn") { e.preventDefault(); e.stopPropagation(); sendAI("Write a professional support request for ConceptFlow AI."); closeModal(); return; }

    if (href && href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) { e.preventDefault(); e.stopPropagation(); go(href); return; }
    }

    if (target.id === "sendProChatBtn" || low === "send") {
      e.preventDefault(); e.stopPropagation(); sendAI(); return;
    }

    if (low.includes("admin") && (low.includes("login") || target.closest("#admin"))) {
      if (low.includes("login admin") || low.includes("admin login")) {
        e.preventDefault(); e.stopPropagation(); loadAdminPanel(); return;
      }
    }

    if (low.includes("logout admin")) {
      e.preventDefault(); e.stopPropagation();
      localStorage.removeItem("cf_token"); localStorage.removeItem("token"); localStorage.removeItem("cf_user");
      toast("Logged out");
      return;
    }

    if (low === "admin" || low.includes("admin dashboard")) {
      e.preventDefault(); e.stopPropagation(); go("#admin"); setTimeout(loadAdminPanel, 400); return;
    }

    if (low.includes("login") || low.includes("signup")) {
      e.preventDefault(); e.stopPropagation(); loginModal(false); return;
    }

    if (low.includes("generate notes")) {
      e.preventDefault(); e.stopPropagation(); studyPrompt("notes"); return;
    }
    if (low.includes("generate questions")) {
      e.preventDefault(); e.stopPropagation(); studyPrompt("questions"); return;
    }
    if (low.includes("generate viva")) {
      e.preventDefault(); e.stopPropagation(); studyPrompt("viva"); return;
    }
    if (low.includes("create plan")) {
      e.preventDefault(); e.stopPropagation(); studyPrompt("revision"); return;
    }
    if (low.includes("upload") || low.includes("my materials")) {
      if (target.tagName !== "INPUT") {
        e.preventDefault(); e.stopPropagation(); handleStudyUpload(); return;
      }
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
    if (input && !input.dataset.finalBound) {
      input.dataset.finalBound = "1";
      input.addEventListener("keydown", e => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendAI();
        }
      });
    }
    updateUserUI();
  }

  document.addEventListener("click", handleClick, true);
  document.addEventListener("DOMContentLoaded", bindEnter);
  setTimeout(bindEnter, 600);
})();
