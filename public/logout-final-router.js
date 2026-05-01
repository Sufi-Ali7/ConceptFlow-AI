/*
  ConceptFlow AI — User/Admin Logout Final Fix
  Loaded absolutely last.
*/
(() => {
  function $(id){ return document.getElementById(id); }

  function getUser(){
    try { return JSON.parse(localStorage.getItem("cf_user") || "{}"); } catch { return {}; }
  }

  function token(){
    return localStorage.getItem("cf_token") || localStorage.getItem("token") || "";
  }

  function clearAuth(){
    localStorage.removeItem("cf_token");
    localStorage.removeItem("token");
    localStorage.removeItem("cf_user");
    localStorage.removeItem("adminLoggedIn");
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

  function esc(s){
    return String(s || "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));
  }

  function findLoginButton(){
    const candidates = [...document.querySelectorAll("button,a")];
    return candidates.find(el => {
      const t = (el.textContent || "").trim().toLowerCase();
      return t === "login" || t === "signup" || t === "saif" || t === "sufi" || t === "admin" || t === "user" || t.includes("@");
    });
  }

  function buildUserMenu(){
    const u = getUser();
    const loggedIn = Boolean(token() && (u.email || u.name));
    const oldWrap = document.querySelector(".user-menu-wrap");

    if(!loggedIn){
      if(oldWrap){
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = "Login";
        btn.className = "user-menu-btn";
        oldWrap.replaceWith(btn);
      }
      return;
    }

    const loginBtn = oldWrap || findLoginButton();
    if(!loginBtn) return;

    if(loginBtn.classList?.contains("user-menu-wrap")){
      const btn = loginBtn.querySelector(".user-menu-btn");
      const info = loginBtn.querySelector(".user-info");
      if(btn) btn.textContent = (u.name || u.email || "User").split("@")[0];
      if(info) info.innerHTML = `<b>${esc(u.name || "User")}</b><br><small>${esc(u.email || "")}</small><br><small>Role: ${esc(u.role || "student")}</small>`;
      return;
    }

    const wrap = document.createElement("div");
    wrap.className = "user-menu-wrap";
    wrap.innerHTML = `
      <button class="user-menu-btn" type="button">${esc((u.name || u.email || "User").split("@")[0])}</button>
      <div class="user-dropdown">
        <div class="user-info">
          <b>${esc(u.name || "User")}</b><br>
          <small>${esc(u.email || "")}</small><br>
          <small>Role: ${esc(u.role || "student")}</small>
        </div>
        <button type="button" data-user-action="dashboard">Dashboard</button>
        <button type="button" data-user-action="history">AI History</button>
        <button type="button" data-user-action="logout" class="logout-danger">Logout User</button>
      </div>
    `;

    loginBtn.replaceWith(wrap);
  }

  function go(hash){
    const el = document.querySelector(hash);
    if(el) el.scrollIntoView({ behavior:"smooth", block:"start" });
  }

  function logout(){
    clearAuth();
    toast("Logged out successfully");
    setTimeout(() => location.reload(), 700);
  }

  function handleClick(e){
    const menuBtn = e.target.closest(".user-menu-btn");
    const actionBtn = e.target.closest("[data-user-action]");
    const logoutAdminText = e.target.closest("a,button");

    if(menuBtn){
      e.preventDefault();
      e.stopPropagation();
      const dd = menuBtn.parentElement.querySelector(".user-dropdown");
      dd?.classList.toggle("show");
      return;
    }

    if(actionBtn){
      e.preventDefault();
      e.stopPropagation();
      const action = actionBtn.dataset.userAction;
      if(action === "logout") return logout();
      if(action === "dashboard") return go("#dashboard");
      if(action === "history") return go("#proChat");
    }

    if(logoutAdminText){
      const txt = (logoutAdminText.textContent || "").trim().toLowerCase();
      if(txt.includes("logout admin") || txt === "logout"){
        e.preventDefault();
        e.stopPropagation();
        return logout();
      }
    }

    if(!e.target.closest(".user-menu-wrap")){
      document.querySelectorAll(".user-dropdown.show").forEach(d => d.classList.remove("show"));
    }
  }

  // Improve admin form placeholders and prevent wrong normal-user confusion
  function fixAdminForm(){
    const adminSec = document.querySelector("#admin") || document.querySelector('[id*="admin" i]');
    if(!adminSec) return;

    const inputs = adminSec.querySelectorAll("input");
    if(inputs[0] && !inputs[0].placeholder) inputs[0].placeholder = "Admin email";
    if(inputs[1] && !inputs[1].placeholder) inputs[1].placeholder = "Admin password";

    const hint = [...adminSec.querySelectorAll("p,small,div")].find(el => (el.textContent || "").includes("Default local"));
    if(hint){
      hint.innerHTML = `Default local: <b>admin@conceptflow.ai</b> / <b>Admin@12345</b><br><small>Run <code>npm run seed</code> after changing ADMIN_EMAIL/ADMIN_PASSWORD.</small>`;
    }
  }

  document.addEventListener("click", handleClick, true);
  document.addEventListener("DOMContentLoaded", () => {
    buildUserMenu();
    fixAdminForm();
  });
  setTimeout(buildUserMenu, 600);
  setTimeout(fixAdminForm, 800);
})();
