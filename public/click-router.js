/*
  ConceptFlow AI — Production Final Click Router
  Loaded last. Fixes all clicks without adding repeated code everywhere.
*/
(() => {
  const $ = (id) => document.getElementById(id);

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

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, c => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    }[c]));
  }

  function modal(html) {
    let m = $("cfModal");
    if (!m) {
      m = document.createElement("div");
      m.id = "cfModal";
      m.className = "cf-modal";
      document.body.appendChild(m);
    }
    m.innerHTML = `<div class="cf-modal-box">
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

  function user() {
    try { return JSON.parse(localStorage.getItem("cf_user") || "{}"); } catch { return {}; }
  }

  function saveAuth(data) {
    if (data.token) {
      localStorage.setItem("cf_token", data.token);
      localStorage.setItem("token", data.token);
    }
    if (data.user) localStorage.setItem("cf_user", JSON.stringify(data.user));
    updateUserUI();
  }

  function updateUserUI() {
    const u = user();
    const name = u.name || u.email || "";
    document.querySelectorAll("button,a").forEach(el => {
      const txt = (el.textContent || "").trim().toLowerCase();
      if ((txt === "login" || txt === "signup") && name) {
        el.textContent = name.split("@")[0];
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

  function addMessage(role, text) {
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

  function localAnswer(q) {
    return `## ${q}

### Short Definition
This topic can be understood by definition, working, example and real use case.

### Step-by-step
1. Understand the purpose.
2. Learn the working logic.
3. Dry run with example.
4. Check common mistakes.
5. Practice questions.

### Interview Points
- Definition
- Working
- Example
- Complexity if applicable
- Use case

### Note
If Gemini is configured correctly, this answer will come from real AI.`;
  }

  async function sendAI(text) {
    const input = $("proChatInput");
    const q = String(text || input?.value || "").trim();
    if (!q) return toast("Question type karo");
    if (input) input.value = "";
    go("#proChat");
    addMessage("user", q);

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
      addMessage("ai", data.answer || localAnswer(q));
    } catch (err) {
      addMessage("ai", localAnswer(q) + `\n\n### Fallback Reason\n${err.message}`);
    }
  }

  window.sendProChat = sendAI;

  function loginModal() {
    modal(`
      <h2>Login / Signup</h2>
      <p>Login required for premium, payment, history and progress.</p>
      <input id="cfName" placeholder="Name" value="${esc(user().name || "")}">
      <input id="cfEmail" placeholder="Email" value="${esc(user().email || "")}">
      <input id="cfPassword" type="password" placeholder="Password">
      <div class="cf-modal-actions">
        <button id="cfSignupBtn" type="button">Signup</button>
        <button id="cfLoginBtn" type="button">Login</button>
      </div>
      <p id="cfAuthMsg"></p>
    `);
  }

  async function auth(mode) {
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
      const res = await fetch("/api/auth/" + mode, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.msg || "Auth failed");
      saveAuth(data);
      if (msg) msg.textContent = mode === "login" ? "Login successful." : "Signup successful.";
      toast(mode === "login" ? "Login successful" : "Signup successful");
      setTimeout(closeModal, 700);
    } catch (err) {
      if (msg) msg.textContent = err.message;
    }
  }

  async function ensureLoginForPayment() {
    if (token()) return true;
    loginModal();
    toast("Premium ke liye pehle login karo");
    return false;
  }

  async function startPayment() {
    if (!(await ensureLoginForPayment())) return;
    try {
      const res = await fetch("/api/billing/create-order", {
        method: "POST",
        headers: { Authorization: "Bearer " + token() }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error || "Payment route error");

      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = resolve;
          s.onerror = reject;
          document.body.appendChild(s);
        });
      }

      const options = {
        key: data.key,
        amount: data.amount || data.order?.amount,
        currency: data.currency || data.order?.currency || "INR",
        name: "ConceptFlow AI",
        description: "Premium Plan",
        order_id: data.order?.id || data.order_id,
        handler: async function (response) {
          toast("Payment success, verifying...");
          const verify = await fetch("/api/billing/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + token() },
            body: JSON.stringify(response)
          });
          const verified = await verify.json().catch(() => ({}));
          if (!verify.ok) throw new Error(verified.message || "Verification failed");
          if (verified.user) localStorage.setItem("cf_user", JSON.stringify(verified.user));
          toast("Premium unlocked");
          modal(`<h2>Premium Activated ✅</h2><p>Your payment is verified and premium plan is active.</p>`);
        },
        modal: {
          ondismiss: () => toast("Payment cancelled")
        }
      };

      new window.Razorpay(options).open();
    } catch (err) {
      modal(`
        <h2>Payment Setup Needed</h2>
        <p>${esc(err.message)}</p>
        <ul class="payment-help-list">
          <li>Make sure you are running latest <b>PRODUCTION_FINAL_REPAIRED</b> folder.</li>
          <li>Check <b>RAZORPAY_KEY_ID</b> starts with <b>rzp_test_</b>.</li>
          <li>Check <b>RAZORPAY_KEY_SECRET</b> is complete.</li>
          <li>Restart server after changing .env.</li>
          <li>Login first, then click Upgrade.</li>
        </ul>
      `);
    }
  }

  function contactModal() {
    modal(`
      <h2>Contact</h2>
      <p>For demo, this opens AI support. You can connect SMTP later.</p>
      <button class="cf-primary-btn" onclick="window.sendProChat('Write a professional contact/support message for ConceptFlow AI')">Ask AI Support</button>
    `);
  }

  function handle(e) {
    const target = e.target.closest("a,button,.subject-card,.language-pro-card,.course-card,.feature-clickable,.feature-card,.feature-item,.feature-box,.trust-grid article,.pricing-card");
    if (!target) return;

    if (e.target.closest("input,textarea,select")) return;

    const txt = (target.textContent || "").trim();
    const low = txt.toLowerCase();
    const href = target.getAttribute?.("href");

    if (target.classList.contains("cf-modal-close")) {
      e.preventDefault();
      closeModal();
      return;
    }

    if (href && href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) {
        e.preventDefault();
        go(href);
        return;
      }
    }

    if (target.id === "sendProChatBtn" || low === "send") {
      e.preventDefault();
      sendAI();
      return;
    }

    if (target.id === "cfSignupBtn") { e.preventDefault(); auth("signup"); return; }
    if (target.id === "cfLoginBtn") { e.preventDefault(); auth("login"); return; }

    if (low.includes("login") || low.includes("signup")) {
      e.preventDefault();
      loginModal();
      return;
    }

    if (low.includes("get started")) {
      e.preventDefault();
      go("#proChat");
      setTimeout(() => $("proChatInput")?.focus(), 300);
      return;
    }

    if (low.includes("upgrade") || low.includes("razorpay") || target.id === "premiumPlanBtn") {
      e.preventDefault();
      startPayment();
      return;
    }

    if (low === "contact" || low.includes("contact")) {
      e.preventDefault();
      contactModal();
      return;
    }

    if (low.includes("more subjects") || low.includes("view all subjects")) {
      e.preventDefault();
      go("#allLanguages");
      return;
    }

    if (low.includes("dsa engine") || low.includes("animated visualizer") || low.includes("code dry run")) {
      e.preventDefault();
      go("#dsaEngine");
      return;
    }

    if (low.includes("practice quiz")) {
      e.preventDefault();
      sendAI("Generate 10 MCQ quiz questions with answers and explanations for DSA, DBMS and OS.");
      return;
    }

    if (target.matches(".subject-card,.language-pro-card,.course-card")) {
      e.preventDefault();
      const title = target.querySelector("h3")?.textContent || txt;
      sendAI(`Teach me ${title} from basics with examples, roadmap, quiz, interview questions and project use cases.`);
      return;
    }

    if (target.matches(".trust-grid article")) {
      e.preventDefault();
      const title = target.querySelector("h3")?.textContent || txt;
      sendAI(`Explain how ConceptFlow AI helps students with ${title}.`);
    }
  }

  function bind() {
    const input = $("proChatInput");
    if (input && !input.dataset.cfBound) {
      input.dataset.cfBound = "1";
      input.addEventListener("keydown", e => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendAI();
        }
      });
    }
    updateUserUI();
  }

  document.addEventListener("click", handle, true);
  document.addEventListener("DOMContentLoaded", bind);
  setTimeout(bind, 500);
})();
