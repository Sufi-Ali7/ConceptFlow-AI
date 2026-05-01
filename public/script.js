/* ConceptFlow AI - Clean Working Frontend JS */

let authToken = localStorage.getItem("cf_token") || "";
let currentUser = JSON.parse(localStorage.getItem("cf_user") || "null");
let currentAnswerMode = "pro-chat";
let lastAnswer = "";

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

function toast(message) {
  let el = $("#toastBox");
  if (!el) {
    el = document.createElement("div");
    el.id = "toastBox";
    el.style.cssText = `
      position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%);
      z-index: 30000; background: #111827; color: white; padding: 12px 18px;
      border-radius: 999px; box-shadow: 0 20px 60px rgba(0,0,0,.35);
      font-weight: 800; opacity: 0; transition: .25s ease; pointer-events:none;
    `;
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.style.opacity = "1";
  setTimeout(() => (el.style.opacity = "0"), 2200);
}

function apiHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  return headers;
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...apiHeaders(),
      ...(options.headers || {})
    }
  });

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!res.ok) {
    throw new Error(data.message || data.error || `Request failed: ${res.status}`);
  }

  return data;
}

function safeScroll(hash) {
  const el = document.querySelector(hash);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));
}

function mdToHtml(md) {
  let text = String(md || "").trim();
  const blocks = [];

  text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    const id = `@@CODE${blocks.length}@@`;
    blocks.push(`<pre><code>${escapeHtml(code)}</code></pre>`);
    return id;
  });

  text = escapeHtml(text);
  text = text.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  text = text.replace(/^## (.*)$/gm, "<h2>$1</h2>");
  text = text.replace(/^# (.*)$/gm, "<h1>$1</h1>");
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");

  text = text.replace(/(?:^|\n)((?:[-*] .*(?:\n|$))+)/g, (_, list) => {
    const items = list.trim().split("\n").map(line => line.replace(/^[-*] /, "").trim());
    return `<ul>${items.map(i => `<li>${i}</li>`).join("")}</ul>`;
  });

  text = text.replace(/(?:^|\n)((?:\d+\. .*(?:\n|$))+)/g, (_, list) => {
    const items = list.trim().split("\n").map(line => line.replace(/^\d+\. /, "").trim());
    return `<ol>${items.map(i => `<li>${i}</li>`).join("")}</ol>`;
  });

  text = text
    .split(/\n{2,}/)
    .map(block => {
      if (/^\s*<(h1|h2|h3|ul|ol|pre)/.test(block)) return block;
      return `<p>${block.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");

  blocks.forEach((html, i) => {
    text = text.replace(`@@CODE${i}@@`, html);
  });

  return text;
}

/* Modal */
function openModal(html) {
  closeModal();

  const overlay = document.createElement("div");
  overlay.id = "appModal";
  overlay.className = "app-modal";
  overlay.innerHTML = `
    <div class="app-modal-card">
      <button class="app-modal-close" type="button">×</button>
      <div id="modalContent">${html}</div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
  $(".app-modal-close", overlay).addEventListener("click", closeModal);
}

function closeModal() {
  $("#appModal")?.remove();
}

window.closeModal = closeModal;
window.openModal = openModal;

/* Auth */
function updateAuthUI() {
  const loginBtn = $("#loginBtn");
  const getBtn = $("#getStartedBtn");

  if (currentUser && loginBtn) {
    loginBtn.textContent = currentUser.name || currentUser.email || "Dashboard";
    loginBtn.onclick = () => safeScroll("#dashboard");
  } else if (loginBtn) {
    loginBtn.textContent = "Login";
    loginBtn.onclick = () => showLoginModal("login");
  }

  if (getBtn) {
    getBtn.onclick = () => {
      if (authToken) safeScroll("#proChat");
      else showLoginModal("signup");
    };
  }
}

function showLoginModal(mode = "login") {
  const isSignup = mode === "signup";

  openModal(`
    <h2>${isSignup ? "Create Account" : "Login to ConceptFlow AI"}</h2>
    <p>${isSignup ? "Create account to save AI history, progress and study materials." : "Continue your learning journey."}</p>
    <div class="form-grid">
      ${isSignup ? `<input id="authName" placeholder="Your name">` : ""}
      <input id="authEmail" placeholder="Email address">
      <input id="authPassword" type="password" placeholder="Password">
      <button class="primary-btn" id="authSubmit">${isSignup ? "Signup" : "Login"}</button>
    </div>
    <button class="action-link" id="switchAuth">${isSignup ? "Already have account? Login" : "New user? Create account"}</button>
    <div class="result-panel" id="authResult"></div>
  `);

  $("#switchAuth").onclick = () => showLoginModal(isSignup ? "login" : "signup");

  $("#authSubmit").onclick = async () => {
    const name = $("#authName")?.value.trim() || "";
    const email = $("#authEmail").value.trim();
    const password = $("#authPassword").value;
    const result = $("#authResult");

    if (!email || !password || (isSignup && !name)) {
      result.textContent = "Please fill all required fields.";
      return;
    }

    result.textContent = "Please wait...";

    try {
      const data = await apiFetch(isSignup ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        body: JSON.stringify(isSignup ? { name, email, password } : { email, password })
      });

      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem("cf_token", authToken);
      localStorage.setItem("cf_user", JSON.stringify(currentUser));
      result.textContent = "Success! You are logged in.";
      toast("Login successful");
      updateAuthUI();
      await loadDashboard();
      setTimeout(closeModal, 600);
    } catch (e) {
      result.textContent = e.message;
    }
  };
}

window.showLoginModal = showLoginModal;

/* AI Chat */
function ensureLogin() {
  if (!authToken) {
    showLoginModal("login");
    return false;
  }
  return true;
}

function addChatMessage(role, content, isError = false) {
  const box = $("#chatMessages");
  if (!box) return null;

  const div = document.createElement("div");
  div.className = `chat-message ${role} ${isError ? "error" : ""}`;
  div.innerHTML = `
    <b>${role === "user" ? "You" : "ConceptFlow AI"}</b>
    <div class="message-content">${role === "ai" && !isError ? mdToHtml(content) : `<p>${escapeHtml(content)}</p>`}</div>
  `;

  if (role === "ai" && !isError) {
    const toolbar = document.createElement("div");
    toolbar.className = "chat-toolbar";

    const copy = document.createElement("button");
    copy.className = "ai-copy-btn";
    copy.textContent = "Copy";
    copy.onclick = () => {
      navigator.clipboard?.writeText(content);
      toast("Answer copied");
    };

    const read = document.createElement("button");
    read.className = "ai-speak-btn";
    read.textContent = "Read";
    read.onclick = () => speakText(content);

    toolbar.append(copy, read);
    div.appendChild(toolbar);
  }

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return div;
}

function addTyping() {
  const box = $("#chatMessages");
  if (!box) return null;
  const div = document.createElement("div");
  div.className = "chat-message ai";
  div.innerHTML = `
    <b>ConceptFlow AI</b>
    <div class="typing-dots"><span></span><span></span><span></span></div>
  `;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return div;
}

async function sendProChat(question = null) {
  const input = $("#proChatInput");
  const q = (question || input?.value || "").trim();

  if (!q) return;
  if (!ensureLogin()) return;

  if (input) input.value = "";

  safeScroll("#proChat");
  addChatMessage("user", q);
  const loading = addTyping();

  try {
    const data = await apiFetch("/api/ai/solve", {
      method: "POST",
      body: JSON.stringify({
        question: q,
        mode: currentAnswerMode,
        subject: "General IT"
      })
    });

    lastAnswer = data.answer || "";
    loading.remove();
    addChatMessage("ai", lastAnswer);

    const answerBox = $("#answerBox");
    if (answerBox) {
      answerBox.innerHTML = `<b>Answer:</b>${mdToHtml(lastAnswer)}`;
    }

    await loadDashboard();
  } catch (e) {
    loading?.remove();
    addChatMessage("ai", `${e.message}\n\nCheck GEMINI_API_KEY, GEMINI_MODEL and restart server.`, true);
  }
}

window.sendProChat = sendProChat;

async function askBackend(question) {
  if ($("#proChat")) {
    safeScroll("#proChat");
    setTimeout(() => sendProChat(question), 250);
    return;
  }
  await sendProChat(question);
}

window.askBackend = askBackend;

/* Main page AI solver */
function bindAISolver() {
  $("#askBtn")?.addEventListener("click", () => {
    const q = $("#questionInput")?.value.trim();
    if (q) askBackend(q);
  });

  $("#questionInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const q = e.currentTarget.value.trim();
      if (q) askBackend(q);
    }
  });

  $$(".example-grid button").forEach(btn => {
    btn.addEventListener("click", () => {
      const q = btn.dataset.question || btn.textContent.trim();
      $("#questionInput").value = q;
      askBackend(q);
    });
  });

  $("#speakAnswerBtn")?.addEventListener("click", () => speakText(lastAnswer || $("#answerBox")?.innerText || ""));
  $("#stopSpeakBtn")?.addEventListener("click", () => speechSynthesis?.cancel());
}

function speakText(text) {
  if (!("speechSynthesis" in window) || !text) return;
  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(String(text).replace(/[#*_`]/g, ""));
  utter.rate = 0.95;
  speechSynthesis.speak(utter);
}

/* Voice typing */
function bindVoice() {
  const btn = $("#voiceBtn");
  if (!btn) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    btn.onclick = () => toast("Voice typing not supported in this browser.");
    return;
  }

  btn.onclick = () => {
    const rec = new SpeechRecognition();
    rec.lang = "en-IN";
    rec.interimResults = false;
    $("#voiceStatus").textContent = "Listening...";
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      $("#questionInput").value = text;
      $("#voiceStatus").textContent = "Voice captured.";
    };
    rec.onerror = () => ($("#voiceStatus").textContent = "Voice error. Try again.");
    rec.onend = () => {
      if ($("#voiceStatus").textContent === "Listening...") $("#voiceStatus").textContent = "Voice typing ready.";
    };
    rec.start();
  };
}

/* Search */
function openSearchOverlay() {
  const old = $("#globalSearchOverlay");
  if (old) {
    old.remove();
    return;
  }

  const overlay = document.createElement("div");
  overlay.id = "globalSearchOverlay";
  overlay.className = "global-search-overlay";
  overlay.innerHTML = `
    <div class="global-search-card">
      <input id="globalSearchInput" placeholder="Search subject or ask AI...">
      <p>Press Enter to ask AI. Click outside to close.</p>
    </div>
  `;
  document.body.appendChild(overlay);

  const input = $("#globalSearchInput");
  input.focus();

  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };

  input.onkeydown = (e) => {
    if (e.key === "Enter") {
      const q = input.value.trim();
      overlay.remove();
      if (q) sendProChat(q);
    }
  };
}

/* Subjects/Languages */
function bindCards() {
  $$(".subject-card").forEach(card => {
    card.onclick = () => {
      const title = $("h3", card)?.textContent.trim() || "IT concept";
      sendProChat(`Teach me ${title} from basics with examples, interview questions and exam points.`);
    };
  });

  $$(".language-grid article").forEach(card => {
    card.onclick = () => {
      const title = $("h3", card)?.textContent.trim() || "Programming";
      sendProChat(`Teach me ${title} from basics with examples, important concepts, interview questions and project use cases.`);
    };
  });

  $$(".chips button").forEach(btn => {
    btn.onclick = () => {
      const q = btn.dataset.search || btn.textContent.trim();
      sendProChat(`Teach me ${q} from basics with examples.`);
    };
  });
}

/* Chat section */
function bindProChat() {
  $("#sendProChatBtn")?.addEventListener("click", () => sendProChat());

  $("#proChatInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendProChat();
    }
  });

  $$("[data-pro-prompt]").forEach(btn => {
    btn.onclick = () => sendProChat(btn.dataset.proPrompt);
  });

  $("#newChatBtn")?.addEventListener("click", () => {
    const box = $("#chatMessages");
    if (box) {
      box.innerHTML = `<div class="chat-message ai"><b>ConceptFlow AI</b><p>New chat started. Ask your question.</p></div>`;
    }
  });

  $("#loadHistoryBtn")?.addEventListener("click", loadAIHistory);

  $$(".mode-pill").forEach(btn => {
    btn.onclick = () => {
      $$(".mode-pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentAnswerMode = btn.dataset.mode || "pro-chat";
    };
  });
}

async function loadAIHistory() {
  if (!ensureLogin()) return;

  openModal(`<h2>AI History</h2><div class="result-panel" id="historyBox">Loading...</div>`);

  try {
    const data = await apiFetch("/api/ai/history");
    const box = $("#historyBox");
    if (!data.questions?.length) {
      box.textContent = "No AI history yet.";
      return;
    }

    box.innerHTML = data.questions.map(q => `
      <div class="history-item">
        <b>${escapeHtml(q.subject || "General")}</b>
        <p>${escapeHtml(q.question)}</p>
      </div>
    `).join("");
  } catch (e) {
    $("#historyBox").textContent = e.message;
  }
}

/* Visualizer */
function showVisualizerModal() {
  openModal(`
    <h2>Complete DSA Animation Visualizer</h2>
    <p>Select any DSA topic.</p>
    <div class="dsa-topic-grid">
      <button data-dsa="linear">Linear Search</button>
      <button data-dsa="binary">Binary Search</button>
      <button data-dsa="bubble">Bubble Sort</button>
      <button data-dsa="selection">Selection Sort</button>
      <button data-dsa="insertion">Insertion Sort</button>
      <button data-dsa="stack">Stack</button>
      <button data-dsa="queue">Queue</button>
      <button data-dsa="linked">Linked List</button>
      <button data-dsa="tree">Tree Traversal</button>
      <button data-dsa="bfs">Graph BFS</button>
      <button data-dsa="dfs">Graph DFS</button>
      <button data-dsa="recursion">Recursion</button>
    </div>
    <div class="visual-stage" id="visualStage"><p>Select a topic above.</p></div>
    <div class="visual-controls" id="visualControls"></div>
    <div class="result-panel" id="visualExplanation">Explanation will appear here.</div>
  `);

  $$("[data-dsa]").forEach(btn => {
    btn.onclick = () => renderDSA(btn.dataset.dsa);
  });
}

window.showVisualizerModal = showVisualizerModal;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function renderCells(arr, active = []) {
  $("#visualStage").innerHTML = `<div class="binary-cells">${arr.map((v, i) => `<div class="binary-cell ${active.includes(i) ? "mid" : ""}">${v}</div>`).join("")}</div>`;
}

function renderBars(arr, active = []) {
  $("#visualStage").innerHTML = `<div class="bar-animation">${arr.map((v, i) => `<span class="${active.includes(i) ? "active" : ""}" style="height:${Math.max(30, v * 2)}px">${v}</span>`).join("")}</div>`;
}

function renderDSA(type) {
  const explanation = $("#visualExplanation");
  const controls = $("#visualControls");
  const arr = [12, 5, 31, 18, 7, 24];

  if (type === "linear") {
    let i = 0, target = 18;
    renderCells(arr);
    controls.innerHTML = `<button id="nextStep">Next Step</button>`;
    $("#nextStep").onclick = () => {
      renderCells(arr, [i]);
      explanation.textContent = arr[i] === target ? `Found ${target} at index ${i}.` : `Checking ${arr[i]}. Move next.`;
      if (arr[i] !== target) i = Math.min(i + 1, arr.length - 1);
    };
  }

  else if (type === "binary") {
    const sorted = [3, 7, 12, 18, 25, 31, 44];
    let low = 0, high = sorted.length - 1, target = 31;
    renderCells(sorted);
    controls.innerHTML = `<button id="nextStep">Next Step</button>`;
    $("#nextStep").onclick = () => {
      if (low > high) return explanation.textContent = "Not found.";
      const mid = Math.floor((low + high) / 2);
      renderCells(sorted, [mid]);
      if (sorted[mid] === target) explanation.textContent = `Found ${target} at middle index ${mid}.`;
      else if (sorted[mid] < target) {
        explanation.textContent = `${sorted[mid]} is smaller than ${target}. Search right half.`;
        low = mid + 1;
      } else {
        explanation.textContent = `${sorted[mid]} is greater than ${target}. Search left half.`;
        high = mid - 1;
      }
    };
  }

  else if (["bubble", "selection", "insertion"].includes(type)) {
    let a = [...arr];
    renderBars(a);
    controls.innerHTML = `<button id="startSort">Start ${type} Sort</button>`;
    $("#startSort").onclick = async () => {
      if (type === "bubble") {
        for (let i = 0; i < a.length; i++) {
          for (let j = 0; j < a.length - i - 1; j++) {
            renderBars(a, [j, j + 1]);
            explanation.textContent = `Compare ${a[j]} and ${a[j + 1]}.`;
            await sleep(350);
            if (a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]];
          }
        }
      }
      if (type === "selection") {
        for (let i = 0; i < a.length; i++) {
          let min = i;
          for (let j = i + 1; j < a.length; j++) {
            renderBars(a, [min, j]);
            await sleep(350);
            if (a[j] < a[min]) min = j;
          }
          [a[i], a[min]] = [a[min], a[i]];
        }
      }
      if (type === "insertion") {
        for (let i = 1; i < a.length; i++) {
          let key = a[i], j = i - 1;
          while (j >= 0 && a[j] > key) {
            a[j + 1] = a[j];
            renderBars(a, [j, j + 1]);
            await sleep(350);
            j--;
          }
          a[j + 1] = key;
        }
      }
      renderBars(a);
      explanation.textContent = `${type} sort complete.`;
    };
  }

  else if (type === "stack") {
    let stack = [];
    controls.innerHTML = `<button id="pushBtn">Push</button><button id="popBtn">Pop</button>`;
    const draw = () => $("#visualStage").innerHTML = `<div class="recursion-stack">${stack.map(x => `<div class="recursion-frame">${x}</div>`).join("") || "<p>Stack empty</p>"}</div>`;
    draw();
    $("#pushBtn").onclick = () => { stack.push(Math.floor(Math.random() * 90)); draw(); explanation.textContent = "Push adds item on top. LIFO."; };
    $("#popBtn").onclick = () => { stack.pop(); draw(); explanation.textContent = "Pop removes top item. LIFO."; };
  }

  else if (type === "queue") {
    let queue = [];
    controls.innerHTML = `<button id="enqueueBtn">Enqueue</button><button id="dequeueBtn">Dequeue</button>`;
    const draw = () => $("#visualStage").innerHTML = `<div class="linked-row">${queue.map(x => `<div class="node-circle">${x}</div>`).join('<span class="arrow">→</span>') || "<p>Queue empty</p>"}</div>`;
    draw();
    $("#enqueueBtn").onclick = () => { queue.push(Math.floor(Math.random() * 90)); draw(); explanation.textContent = "Enqueue inserts at rear. FIFO."; };
    $("#dequeueBtn").onclick = () => { queue.shift(); draw(); explanation.textContent = "Dequeue removes from front. FIFO."; };
  }

  else {
    const labels = type === "recursion" ? ["f(5)", "f(4)", "f(3)", "f(2)", "f(1)", "base"] : ["A", "B", "C", "D", "E"];
    let step = 0;
    controls.innerHTML = `<button id="nextStep">Next Step</button>`;
    const draw = () => $("#visualStage").innerHTML = `<div class="linked-row">${labels.map((x, i) => `<div class="node-circle ${i === step ? "active" : ""}">${x}</div>`).join('<span class="arrow">→</span>')}</div>`;
    draw();
    $("#nextStep").onclick = () => {
      draw();
      explanation.textContent = `${type.toUpperCase()} step ${step + 1}: visiting ${labels[step]}.`;
      step = Math.min(step + 1, labels.length - 1);
    };
  }
}

/* Dashboard */
async function loadDashboard() {
  if (!authToken) return;
  try {
    const data = await apiFetch("/api/progress");
    const progressText = $("#progressText");
    if (progressText && data.progress) {
      progressText.textContent = `${data.progress.completedConcepts || 0}/${data.progress.totalConcepts || 100} concepts completed`;
    }
  } catch {}
}

/* Admin */
async function adminLogin() {
  const email = $("#adminEmail")?.value || "";
  const password = $("#adminPassword")?.value || "";
  const status = $("#adminLoginStatus");

  try {
    const data = await apiFetch("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem("cf_admin_token", data.token);
    status.textContent = "Admin login successful.";
    await loadAdminStats();
  } catch (e) {
    status.textContent = e.message;
  }
}

async function loadAdminStats() {
  const token = localStorage.getItem("cf_admin_token");
  const box = $("#adminStatsBox");
  if (!box || !token) return;

  try {
    const res = await fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    box.innerHTML = `
      <p><b>Users:</b> ${data.stats.users}</p>
      <p><b>Premium Users:</b> ${data.stats.premiumUsers}</p>
      <p><b>AI Questions:</b> ${data.stats.questions}</p>
      <p><b>Payments:</b> ${data.stats.payments}</p>
      <p><b>Study Materials:</b> ${data.stats.materials}</p>
    `;
  } catch (e) {
    box.textContent = e.message;
  }
}

/* Global bindings */
function bindGlobal() {
  updateAuthUI();

  $$(".main-nav a").forEach(a => {
    a.onclick = (e) => {
      e.preventDefault();
      $$(".main-nav a").forEach(x => x.classList.remove("active"));
      a.classList.add("active");
      safeScroll(a.getAttribute("href"));
    };
  });

  $(".brand")?.addEventListener("click", (e) => {
    e.preventDefault();
    safeScroll("#home");
  });

  $("#themeToggle")?.addEventListener("click", () => {
    const current = document.body.dataset.theme || "dark";
    const next = current === "light" ? "dark" : "light";
    document.body.dataset.theme = next;
    localStorage.setItem("cf_theme", next);
  });

  $$("#searchBtn").forEach(btn => {
    btn.onclick = openSearchOverlay;
  });

  $$("#showAllBtn").forEach(btn => {
    btn.onclick = () => toast("All subjects are visible below.");
  });

  $("#adminLoginBtn")?.addEventListener("click", adminLogin);
  $("#adminLogoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("cf_admin_token");
    $("#adminStatsBox").innerHTML = "<p>Admin logged out.</p>";
  });

  bindAISolver();
  bindVoice();
  bindCards();
  bindProChat();

  $$("a[href='#visualizer'], button").forEach(el => {
    const text = (el.textContent || "").toLowerCase();
    if (el.getAttribute("href") === "#visualizer" || text.includes("visualizer") || text.includes("animation")) {
      el.addEventListener("click", (e) => {
        if (text.includes("visualizer") || text.includes("animation")) {
          e.preventDefault();
          showVisualizerModal();
        }
      });
    }
  });

  const savedTheme = localStorage.getItem("cf_theme");
  if (savedTheme) document.body.dataset.theme = savedTheme;
}

document.addEventListener("DOMContentLoaded", bindGlobal);
window.addEventListener("load", () => {
  updateAuthUI();
  loadDashboard();
  loadAdminStats();
});

/* Kill old service worker cache once */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations?.().then(regs => regs.forEach(reg => reg.unregister())).catch(() => {});
}


/* Final chat compact JS cleanup */
document.addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("chatMessages");
  if (box) {
    box.querySelectorAll(".chat-message").forEach(msg => {
      msg.style.minHeight = "unset";
      msg.style.height = "auto";
    });
  }
});

// Override new chat to compact welcome card
const oldNewChatBtn = document.getElementById("newChatBtn");
if (oldNewChatBtn) {
  oldNewChatBtn.onclick = () => {
    const box = document.getElementById("chatMessages");
    if (box) {
      box.innerHTML = `
        <div class="chat-message ai">
          <b>ConceptFlow AI</b>
          <div class="message-content"><p>New chat started. Ask any IT, coding, DSA, exam, roadmap or interview question.</p></div>
        </div>
      `;
    }
  };
}


/* CHAT DEEP CHECK FINAL PATCH */
(function chatDeepCheckPatch() {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(() => {
    const input = document.getElementById("proChatInput");
    const send = document.getElementById("sendProChatBtn");
    const newChat = document.getElementById("newChatBtn");
    const history = document.getElementById("loadHistoryBtn");

    if (send) {
      send.onclick = () => {
        if (typeof sendProChat === "function") sendProChat();
      };
    }

    if (input) {
      input.onkeydown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (typeof sendProChat === "function") sendProChat();
        }
      };

      input.addEventListener("input", () => {
        input.style.height = "54px";
        input.style.height = Math.min(input.scrollHeight, 130) + "px";
      });
    }

    document.querySelectorAll("[data-pro-prompt]").forEach(btn => {
      btn.onclick = () => {
        if (typeof sendProChat === "function") sendProChat(btn.dataset.proPrompt);
      };
    });

    if (newChat) {
      newChat.onclick = () => {
        const box = document.getElementById("chatMessages");
        if (box) {
          box.innerHTML = `
            <div class="chat-message ai">
              <b>ConceptFlow AI</b>
              <div class="message-content"><p>New chat started. Ask any IT, coding, DSA, exam, roadmap or interview question.</p></div>
            </div>
          `;
        }
      };
    }

    if (history) {
      history.onclick = () => {
        if (typeof loadAIHistory === "function") loadAIHistory();
      };
    }
  });
})();

/* ===== Real Product Upgrade JS ===== */
const allLanguages = [
  ["Python","Py","Basics, OOP, ML, automation, data science."],
  ["JavaScript","JS","Frontend, backend, DOM, APIs, React."],
  ["TypeScript","TS","Typed JavaScript, scalable frontend/backend."],
  ["Java","Java","OOP, collections, DSA, Spring basics."],
  ["C","C","Pointers, memory, procedural programming."],
  ["C++","C++","STL, OOP, DSA, competitive programming."],
  ["C#","C#",".NET, OOP, desktop and backend apps."],
  ["PHP","PHP","Forms, sessions, cookies, MySQL projects."],
  ["Ruby","Rb","Rails, scripting and backend development."],
  ["Go","Go","Fast backend, concurrency, cloud systems."],
  ["Rust","Rs","Memory safety, systems programming."],
  ["Swift","Swift","iOS and Apple ecosystem apps."],
  ["Kotlin","Kt","Android apps and modern JVM development."],
  ["Dart","Dart","Flutter mobile app development."],
  ["R","R","Statistics, analytics and data science."],
  ["SQL","SQL","Queries, joins, normalization, DB design."],
  ["HTML","HTML","Page structure and semantic web."],
  ["CSS","CSS","Responsive UI, animations and layouts."],
  ["React","React","Components, hooks, routing and UI projects."],
  ["Node.js","Node","Express APIs, auth, MongoDB backend."],
  ["MongoDB","Mongo","NoSQL, aggregation, indexes, Mongoose."],
  ["Git & GitHub","Git","Version control, branches and deployment."],
  ["Docker","Docker","Containers and deployment workflow."],
  ["Linux","Linux","Commands, shell, server basics."],
  ["AI Prompting","AI","Prompt engineering and AI product features."],
  ["Cloud Computing","Cloud","AWS, Azure, GCP and deployment basics."]
];

function renderAllLanguages() {
  const grid = document.getElementById("allLanguageGrid");
  if (!grid) return;
  grid.innerHTML = allLanguages.map(([name, logo, desc]) => `
    <article class="language-pro-card" data-lang="${name}">
      <div class="lang-logo">${logo}</div>
      <h3>${name}</h3>
      <p>${desc}</p>
    </article>
  `).join("");

  grid.querySelectorAll(".language-pro-card").forEach(card => {
    card.onclick = () => {
      const lang = card.dataset.lang;
      if (typeof sendProChat === "function") {
        safeScroll("#proChat");
        setTimeout(() => sendProChat(`Teach me ${lang} from basics to advanced. Include roadmap, examples, projects, interview questions and mistakes to avoid.`), 350);
      }
    };
  });
}

function bindProductUpgrade() {
  renderAllLanguages();

  document.querySelectorAll(".course-card").forEach(card => {
    card.onclick = () => {
      const course = card.dataset.course || "course";
      safeScroll("#proChat");
      setTimeout(() => {
        if (typeof sendProChat === "function") {
          sendProChat(`Create a complete structured course for ${course}. Include units, topics, animations, quizzes, projects, timeline and certificate criteria.`);
        }
      }, 350);
    };
  });

  document.querySelectorAll("[data-learn]").forEach(btn => {
    btn.onclick = () => {
      safeScroll("#proChat");
      setTimeout(() => sendProChat(`Help me continue learning: ${btn.dataset.learn}`), 300);
    };
  });

  document.getElementById("openHistoryFromDash")?.addEventListener("click", () => {
    if (typeof loadAIHistory === "function") loadAIHistory();
  });

  document.getElementById("studyUploadBtn")?.addEventListener("click", () => {
    const file = document.getElementById("studyFileInput")?.files?.[0];
    const out = document.getElementById("studyUploadResult");
    if (!file) {
      out.textContent = "Please choose a file first.";
      return;
    }
    out.innerHTML = `<b>${file.name}</b> selected. For production, connect backend file parsing + Gemini summary.`;
    safeScroll("#proChat");
    setTimeout(() => {
      if (typeof sendProChat === "function") {
        sendProChat(`Create exam notes, important questions and viva questions for a study material named: ${file.name}.`);
      }
    }, 400);
  });

  document.getElementById("generateCertificateBtn")?.addEventListener("click", () => {
    openModal(`
      <h2>Certificate Preview</h2>
      <div class="result-panel">
        <h2>Certificate of Completion</h2>
        <p>This certifies that the learner has completed ConceptFlow AI course requirements.</p>
        <p><b>Certificate ID:</b> CFAI-${Date.now().toString().slice(-8)}</p>
        <button onclick="window.print()" class="primary-btn">Print / Save PDF</button>
      </div>
    `);
  });

  document.getElementById("premiumPlanBtn")?.addEventListener("click", () => {
    if (typeof upgradeToPremium === "function") upgradeToPremium();
    else toast("Razorpay payment route is ready. Add Razorpay keys in .env.");
  });

  document.querySelectorAll("[data-policy]").forEach(btn => {
    btn.onclick = () => {
      const type = btn.dataset.policy;
      const title = type === "privacy" ? "Privacy Policy" : type === "terms" ? "Terms & Conditions" : "Refund Policy";
      openModal(`<h2>${title}</h2><div class="result-panel"><p>This is a starter ${title}. Before public launch, replace this with your official legal policy.</p></div>`);
    };
  });

  document.getElementById("contactSubmitBtn")?.addEventListener("click", () => {
    const result = document.getElementById("contactResult");
    result.textContent = "Message saved locally for demo. Connect SMTP/database for production contact form.";
  });
}

document.addEventListener("DOMContentLoaded", bindProductUpgrade);
setTimeout(bindProductUpgrade, 1000);


/* A_TO_Z_CLEAN_FINAL_PATCH */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("section").forEach(sec => {
    if (sec.id !== "allLanguages") {
      const h = (sec.querySelector("h2")?.textContent || "").trim().toLowerCase();
      if (h.includes("programming languages") && h.includes("tools")) {
        sec.style.display = "none";
      }
    }
  });

  document.querySelectorAll('a[href="#languages"]').forEach(a => {
    a.setAttribute("href", "#allLanguages");
  });

  console.log("ConceptFlow AI A-to-Z clean check loaded: duplicate language section fixed.");
});


/* ===== UI FLOW + SUBJECT LIBRARY FINAL PATCH ===== */
const subjectLogoMapFinal = {
  "data structures & algorithms": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg",
  "operating system": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg",
  "dbms": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg",
  "database management system": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg",
  "computer networks": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/networkx/networkx-original.svg",
  "artificial intelligence": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
  "machine learning": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg",
  "deep learning": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytorch/pytorch-original.svg",
  "more subjects": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg"
};

function normalizeSubjectTitleFinal(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function fixSubjectLibraryFinal() {
  const cards = Array.from(document.querySelectorAll(".subject-card, [data-subject-card]"));

  cards.forEach(card => {
    const titleEl = card.querySelector("h3") || card.querySelector("h4") || card.querySelector("strong");
    const title = normalizeSubjectTitleFinal(titleEl?.textContent || card.textContent);

    let key = Object.keys(subjectLogoMapFinal).find(k => title.includes(k));
    if (!key && title.includes("more")) key = "more subjects";

    const logo = key ? subjectLogoMapFinal[key] : "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg";

    // Replace old wrong icons only inside subject cards
    const oldIcon = card.querySelector(".subject-real-logo");
    if (!oldIcon) {
      const existingIcon = card.querySelector("img, .icon-box, .subject-icon");
      const logoBox = document.createElement("div");
      logoBox.className = "subject-real-logo";
      logoBox.innerHTML = `<img src="${logo}" alt="${titleEl?.textContent || "Subject"} logo" loading="lazy">`;

      if (existingIcon) {
        existingIcon.replaceWith(logoBox);
      } else {
        card.prepend(logoBox);
      }
    } else {
      const img = oldIcon.querySelector("img");
      if (img) img.src = logo;
    }

    // Make subject card clickable
    card.style.cursor = "pointer";
    card.onclick = (e) => {
      e.preventDefault();
      const label = titleEl?.textContent?.trim() || "Computer Science";
      if (label.toLowerCase().includes("more")) {
        const target = document.getElementById("allLanguages") || document.getElementById("courses");
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
        if (typeof toast === "function") toast("More subjects opened");
        return;
      }

      if (typeof sendProChat === "function") {
        const chat = document.getElementById("proChat");
        chat?.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => {
          sendProChat(`Teach me ${label} from basics. Include syllabus-style topics, examples, interview questions, quiz and roadmap.`);
        }, 350);
      }
    };
  });

  // View all subjects link
  document.querySelectorAll("a, button").forEach(el => {
    const text = (el.textContent || "").toLowerCase();
    if (text.includes("view all subjects")) {
      el.onclick = (e) => {
        e.preventDefault();
        const target = document.getElementById("allLanguages") || document.getElementById("courses");
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      };
    }
  });
}

function fixSectionOrderFinal() {
  // No DOM reorder to avoid breaking; final flow guidance is via navbar and spacing.
  document.querySelectorAll('a[href="#languages"]').forEach(a => a.setAttribute("href", "#allLanguages"));
  document.querySelectorAll('a[href="#allLanguages"]').forEach(a => {
    if (a.textContent.trim().toLowerCase() === "languages") {
      a.onclick = (e) => {
        e.preventDefault();
        document.getElementById("allLanguages")?.scrollIntoView({ behavior: "smooth", block: "start" });
      };
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  fixSubjectLibraryFinal();
  fixSectionOrderFinal();
});

setTimeout(fixSubjectLibraryFinal, 500);
setTimeout(fixSubjectLibraryFinal, 1500);
setTimeout(fixSectionOrderFinal, 1000);


/* =========================================================
   FINAL UI POLISH PATCH — real logos + working trust cards
   ========================================================= */
const finalIconMap = {
  python: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
  javascript: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
  typescript: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
  java: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg",
  c: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg",
  "c++": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg",
  "c#": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg",
  php: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg",
  ruby: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg",
  go: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg",
  rust: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-original.svg",
  swift: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg",
  kotlin: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg",
  dart: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dart/dart-original.svg",
  r: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/r/r-original.svg",
  sql: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg",
  html: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
  css: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",
  react: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
  "react js": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
  "node.js": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
  mongodb: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg",
  "git & github": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg",
  git: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg",
  docker: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg",
  linux: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg",
  "ai prompting": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg",
  "ai / ml": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg",
  "machine learning": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg",
  "deep learning": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytorch/pytorch-original.svg",
  "artificial intelligence": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
  "dbms": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg",
  "computer networks": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/networkx/networkx-original.svg",
  "operating system": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg",
  "data structures & algorithms": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg"
};

function finalTitleOf(card) {
  return (card.querySelector("h3")?.textContent || card.querySelector("h4")?.textContent || "").trim();
}

function finalIconFor(title) {
  const t = String(title || "").trim().toLowerCase();
  if (t.includes("more")) return null;
  if (finalIconMap[t]) return finalIconMap[t];
  const key = Object.keys(finalIconMap).find(k => t.includes(k));
  return key ? finalIconMap[key] : finalIconMap.python;
}

function applyRealLogoToCard(card, type = "subject") {
  const title = finalTitleOf(card);
  if (!title) return;

  const existing = card.querySelector(".subject-real-logo, .lang-real-logo, .lang-logo, .icon-box, .subject-icon");
  const cls = type === "language" ? "lang-real-logo" : "subject-real-logo";

  const logoBox = document.createElement("div");
  logoBox.className = cls;

  if (title.toLowerCase().includes("more")) {
    logoBox.innerHTML = `<div class="more-subjects-icon"><span></span><span></span><span></span><span></span></div>`;
  } else {
    const src = finalIconFor(title);
    logoBox.innerHTML = `<img src="${src}" alt="${title} logo" loading="lazy">`;
  }

  if (existing) existing.replaceWith(logoBox);
  else card.prepend(logoBox);
}

function finalPolishCards() {
  document.querySelectorAll(".subject-card").forEach(card => {
    applyRealLogoToCard(card, "subject");

    const title = finalTitleOf(card);
    card.onclick = (e) => {
      e.preventDefault();
      if (title.toLowerCase().includes("more")) {
        document.getElementById("allLanguages")?.scrollIntoView({ behavior: "smooth", block: "start" });
        if (typeof toast === "function") toast("More subjects opened");
        return;
      }
      document.getElementById("proChat")?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => {
        if (typeof sendProChat === "function") {
          sendProChat(`Teach me ${title} from basics with roadmap, examples, quiz, interview questions and project ideas.`);
        }
      }, 350);
    };
  });

  document.querySelectorAll(".language-pro-card").forEach(card => {
    applyRealLogoToCard(card, "language");
  });

  document.querySelectorAll(".trust-grid article").forEach(card => {
    const title = finalTitleOf(card) || card.querySelector("h3")?.textContent || "ConceptFlow AI";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.onclick = () => {
      document.getElementById("proChat")?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => {
        if (typeof sendProChat === "function") {
          sendProChat(`Explain how ConceptFlow AI helps with ${title}. Keep it student-friendly and practical.`);
        }
      }, 350);
    };
  });

  document.querySelectorAll("a,button").forEach(el => {
    const text = (el.textContent || "").toLowerCase();
    if (text.includes("view all subjects")) {
      el.onclick = (e) => {
        e.preventDefault();
        document.getElementById("allLanguages")?.scrollIntoView({ behavior: "smooth", block: "start" });
      };
    }
  });
}

document.addEventListener("DOMContentLoaded", finalPolishCards);
setTimeout(finalPolishCards, 600);
setTimeout(finalPolishCards, 1600);


/* DSA clean module bridge */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("a,button,.feature-clickable,.feature-card").forEach(el => {
    const t = (el.textContent || "").toLowerCase();
    if (t.includes("animated visualizer") || t.includes("dsa visualizer")) {
      el.addEventListener("click", (e) => {
        const dsa = document.getElementById("dsaEngine");
        if (dsa) {
          e.preventDefault();
          dsa.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
  });
});


/* =========================================================
   FULL WORKING STABILIZER — robust click handlers + fallbacks
   ========================================================= */
(function fullWorkingStabilizer(){
  const $ = (id) => document.getElementById(id);
  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));

  function showToastSafe(msg){
    if (typeof window.toast === "function") return window.toast(msg);
    let el = document.getElementById("toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.style.cssText = "position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#0f172a;color:#fff;padding:12px 18px;border-radius:999px;z-index:99999;border:1px solid rgba(148,163,184,.35);box-shadow:0 20px 60px rgba(0,0,0,.25);font-weight:800";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    setTimeout(()=>{ el.style.opacity = "0"; }, 2200);
  }

  function openModalSafe(html){
    if (typeof window.openModal === "function") return window.openModal(html);
    let wrap = document.getElementById("fallbackModal");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "fallbackModal";
      wrap.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99998;display:grid;place-items:center;padding:20px";
      document.body.appendChild(wrap);
    }
    wrap.innerHTML = `<div style="max-width:760px;width:100%;max-height:85vh;overflow:auto;background:#0f172a;color:#fff;border:1px solid rgba(148,163,184,.25);border-radius:24px;padding:24px;box-shadow:0 30px 90px rgba(0,0,0,.35)">
      <button id="fallbackModalClose" style="float:right;border:0;border-radius:12px;padding:8px 12px;cursor:pointer">Close</button>
      ${html}
    </div>`;
    wrap.style.display = "grid";
    document.getElementById("fallbackModalClose").onclick = () => wrap.style.display = "none";
    wrap.onclick = (e) => { if (e.target === wrap) wrap.style.display = "none"; };
  }

  function scrollToSafe(id){
    const target = typeof id === "string" ? document.querySelector(id) : id;
    if (target) target.scrollIntoView({behavior:"smooth", block:"start"});
  }

  function localAIAnswer(question){
    const q = String(question || "").toLowerCase();
    let topic = question || "this topic";
    let type = "concept";
    if (q.includes("binary")) type = "Binary Search";
    else if (q.includes("sort")) type = "Sorting";
    else if (q.includes("dbms")) type = "DBMS";
    else if (q.includes("python")) type = "Python";
    else if (q.includes("java")) type = "Java";
    else if (q.includes("operating")) type = "Operating System";

    return `## ${type} Explanation

### 1. Definition
${topic} is explained by understanding its purpose, working steps, example, and practical use.

### 2. Simple Explanation
Break the topic into smaller parts. First understand what problem it solves, then how it works internally.

### 3. Example
For example, Binary Search works only on a sorted array and repeatedly divides the search space into half.

### 4. Interview Points
- Know the definition.
- Explain step-by-step working.
- Give one example.
- Mention time and space complexity.
- Discuss common mistakes.

### 5. Common Mistakes
- Memorizing without dry run.
- Ignoring edge cases.
- Not explaining why a step happens.

### 6. Exam Format
Definition → Working → Example → Diagram/Dry Run → Advantages → Conclusion.`;
  }

  function mdToHtmlSafe(md){
    if (typeof window.mdToHtml === "function") return window.mdToHtml(md);
    return String(md || "")
      .replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))
      .replace(/^### (.*)$/gm, "<h3>$1</h3>")
      .replace(/^## (.*)$/gm, "<h2>$1</h2>")
      .replace(/^- (.*)$/gm, "<li>$1</li>")
      .replace(/\n/g, "<br>");
  }

  function addChatMessageSafe(role, text){
    const box = $("chatMessages");
    if (!box) return;
    const div = document.createElement("div");
    div.className = `chat-message ${role === "user" ? "user" : "ai"}`;
    div.innerHTML = role === "user"
      ? `<b>You</b><div class="message-content"><p>${String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}</p></div>`
      : `<b>ConceptFlow AI</b><div class="message-content">${mdToHtmlSafe(text)}</div>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  window.sendProChat = window.sendProChat || async function(promptText){
    const input = $("proChatInput");
    const question = (promptText || input?.value || "").trim();
    if (!question) return showToastSafe("Please type a question.");
    if (input) input.value = "";
    addChatMessageSafe("user", question);

    const token = localStorage.getItem("cf_token") || localStorage.getItem("token") || "";
    try {
      const res = await fetch("/api/ai/solve", {
        method:"POST",
        headers: {"Content-Type":"application/json", ...(token ? {Authorization:`Bearer ${token}`} : {})},
        body: JSON.stringify({question})
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data.message || "AI API not ready");
      addChatMessageSafe("ai", data.answer || data.finalAnswer || data.response || localAIAnswer(question));
    } catch (e) {
      addChatMessageSafe("ai", localAIAnswer(question) + `\n\n> Local fallback mode: ${e.message}`);
    }
  };

  function bindChat(){
    const send = $("sendProChatBtn");
    const input = $("proChatInput");
    if (send) send.onclick = () => window.sendProChat();
    if (input) {
      input.onkeydown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          window.sendProChat();
        }
      };
    }
    qsa("[data-pro-prompt]").forEach(btn => {
      btn.onclick = () => window.sendProChat(btn.dataset.proPrompt || btn.textContent);
    });
  }

  function bindAuth(){
    // Normalize token keys
    const old = localStorage.getItem("token");
    if (old && !localStorage.getItem("cf_token")) localStorage.setItem("cf_token", old);

    qsa("button,a").forEach(el => {
      const text = (el.textContent || "").trim().toLowerCase();
      if (text === "login" || text.includes("login / signup")) {
        el.onclick = (e) => {
          e.preventDefault();
          if (typeof window.showLoginModal === "function") return window.showLoginModal();
          openModalSafe(`<h2>Login / Signup</h2><p>Use the built-in auth routes. If modal UI is unavailable, test auth with /api/auth/signup and /api/auth/login.</p>`);
        };
      }
      if (text.includes("get started")) {
        el.onclick = (e) => {
          e.preventDefault();
          scrollToSafe("#proChat");
          setTimeout(()=> $("proChatInput")?.focus(), 350);
        };
      }
    });
  }

  function bindNavigation(){
    qsa('a[href^="#"]').forEach(a => {
      a.onclick = (e) => {
        const href = a.getAttribute("href");
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          scrollToSafe(target);
        }
      };
    });
  }

  function bindSubjectsAndLanguages(){
    qsa(".subject-card,.language-pro-card,.course-card").forEach(card => {
      if (card.dataset.boundStable) return;
      card.dataset.boundStable = "1";
      card.style.cursor = "pointer";
      card.onclick = (e) => {
        e.preventDefault();
        const title = (card.querySelector("h3")?.textContent || card.textContent || "Computer Science").trim();
        if (title.toLowerCase().includes("more")) return scrollToSafe("#allLanguages");
        scrollToSafe("#proChat");
        setTimeout(()=> window.sendProChat(`Teach me ${title} from basics with examples, roadmap, quiz, interview questions and project use cases.`), 350);
      };
    });

    qsa("button,a").forEach(el => {
      const text = (el.textContent || "").toLowerCase();
      if (text.includes("view all subjects")) {
        el.onclick = (e) => { e.preventDefault(); scrollToSafe("#allLanguages"); };
      }
    });
  }

  function bindFeatureCards(){
    const map = [
      ["animated visualizer", "#dsaEngine"],
      ["ai explanation", "#proChat"],
      ["practice quiz", "#practice"],
      ["code dry run", "#dsaEngine"],
      ["career roadmaps", "#roadmap"],
      ["progress tracking", "#dashboard"]
    ];

    qsa(".feature-clickable,.feature-card,.feature-item,.feature-box,article").forEach(card => {
      const text = (card.textContent || "").toLowerCase();
      const found = map.find(([key]) => text.includes(key));
      if (!found || card.dataset.boundFeatureStable) return;
      card.dataset.boundFeatureStable = "1";
      card.style.cursor = "pointer";
      card.onclick = (e) => {
        e.preventDefault();
        const [key, target] = found;
        if (key.includes("practice")) {
          openModalSafe(`<h2>Practice Quiz</h2><p>Quick quiz is ready.</p><button onclick="window.sendProChat('Give me 10 MCQ quiz questions with answers for DSA and DBMS')">Generate Quiz with AI</button>`);
          return;
        }
        scrollToSafe(target);
      };
    });
  }

  function bindTrustPricingStudy(){
    qsa(".trust-grid article").forEach(card => {
      card.onclick = () => {
        const title = card.querySelector("h3")?.textContent || "ConceptFlow AI";
        scrollToSafe("#proChat");
        setTimeout(()=> window.sendProChat(`Explain how ConceptFlow AI helps with ${title} in practical student life.`), 350);
      };
    });

    const premium = $("premiumPlanBtn");
    if (premium) {
      premium.onclick = async () => {
        try {
          const token = localStorage.getItem("cf_token") || localStorage.getItem("token") || "";
          const res = await fetch("/api/billing/create-order", {method:"POST", headers:{Authorization:`Bearer ${token}`}});
          if (!res.ok) throw new Error("Razorpay keys not configured");
          showToastSafe("Payment order created. Complete Razorpay checkout.");
        } catch(e) {
          openModalSafe(`<h2>Payment Setup Needed</h2><p>Razorpay works after setting <b>RAZORPAY_KEY_ID</b> and <b>RAZORPAY_KEY_SECRET</b> in .env.</p>`);
        }
      };
    }

    const upload = $("studyUploadBtn");
    if (upload) {
      upload.onclick = () => {
        const file = $("studyFileInput")?.files?.[0];
        const result = $("studyUploadResult");
        if (!file) {
          if (result) result.textContent = "Please choose a PDF/TXT/DOC file first.";
          return;
        }
        if (result) result.textContent = `${file.name} selected. Asking AI for notes format...`;
        scrollToSafe("#proChat");
        setTimeout(()=> window.sendProChat(`Create exam notes, important questions and viva questions for uploaded study material named ${file.name}.`), 350);
      };
    }
  }

  function bindSearch(){
    qsa("input[type='search'], input[placeholder*='Search'], .search-input").forEach(inp => {
      if (inp.dataset.boundSearchStable) return;
      inp.dataset.boundSearchStable = "1";
      inp.addEventListener("keydown", e => {
        if (e.key === "Enter") {
          const q = inp.value.trim();
          if (q) {
            scrollToSafe("#proChat");
            setTimeout(()=> window.sendProChat(`Search and explain: ${q}`), 300);
          }
        }
      });
    });
  }

  function bindAll(){
    bindChat();
    bindAuth();
    bindNavigation();
    bindSubjectsAndLanguages();
    bindFeatureCards();
    bindTrustPricingStudy();
    bindSearch();
  }

  document.addEventListener("DOMContentLoaded", bindAll);
  setTimeout(bindAll, 600);
  setTimeout(bindAll, 1600);
})();
