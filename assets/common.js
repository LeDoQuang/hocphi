(() => {
  "use strict";

  const API_BASE = String(window.HOCPHI_CONFIG?.API_BASE || "").replace(/\/$/, "");
  const TOKEN_KEY = "hocphi_student_token_v1";
  const PROFILE_KEY = "hocphi_student_profile_v1";

  function token(){ return localStorage.getItem(TOKEN_KEY) || ""; }
  function saveToken(value){ localStorage.setItem(TOKEN_KEY, String(value || "")); }
  function clearToken(){ localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(PROFILE_KEY); }
  function saveProfile(student){ localStorage.setItem(PROFILE_KEY, JSON.stringify(student || {})); }
  function profile(){
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}"); }
    catch { return {}; }
  }
  function redirect(path){ window.location.replace(path); }
  function requireAuth(){ if(!token()) redirect("./index.html"); }
  function requireConfig(){ if(!API_BASE) throw new Error("Trang học viên chưa được cấu hình máy chủ."); }

  function formatVnd(value){
    return new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + " đ";
  }
  function formatDate(value){
    if(!value) return "—";
    const parts = String(value).split("-");
    if(parts.length !== 3) return String(value);
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  function formatMonth(value){
    if(!value) return "Không rõ tháng";
    const parts = String(value).split("-");
    if(parts.length < 2) return String(value);
    return `Tháng ${Number(parts[1])}/${parts[0]}`;
  }

  async function api(path, options = {}){
    requireConfig();
    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", "application/json");
    if(token()) headers.set("Authorization", `Bearer ${token()}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let res;
    try{
      res = await fetch(API_BASE + path, {...options, headers, signal: controller.signal, cache:"no-store"});
    }catch(err){
      if(err?.name === "AbortError") throw new Error("Máy chủ phản hồi quá lâu. Vui lòng thử lại.");
      throw new Error("Không kết nối được máy chủ học phí.");
    }finally{
      clearTimeout(timeout);
    }

    let data = {};
    try { data = await res.json(); } catch {}
    if(res.status === 401 && path !== "/api/login"){
      clearToken();
      redirect("./index.html?expired=1");
      throw new Error("Phiên đăng nhập đã hết hạn");
    }
    if(!res.ok) throw new Error(data?.detail || `Máy chủ trả lỗi ${res.status}`);
    return data;
  }

  function fillIdentity(student){
    const p = student || profile();
    document.querySelectorAll("[data-student-name]").forEach(node => node.textContent = p.full_name || "Học viên");
    document.querySelectorAll("[data-student-code]").forEach(node => node.textContent = p.payment_code || "—");
  }
  function logout(){ clearToken(); redirect("./index.html"); }
  function bindLogout(){ document.querySelectorAll("[data-logout]").forEach(btn => btn.addEventListener("click", logout)); }
  function toast(message){
    const old = document.querySelector(".toast");
    if(old) old.remove();
    const node = document.createElement("div");
    node.className = "toast";
    node.setAttribute("role", "status");
    node.textContent = message;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 3200);
  }
  function el(tag, className, text){
    const node = document.createElement(tag);
    if(className) node.className = className;
    if(text !== undefined) node.textContent = text;
    return node;
  }

  window.HocPhi = {
    API_BASE, token, saveToken, clearToken, saveProfile, profile, redirect, requireAuth,
    requireConfig, formatVnd, formatDate, formatMonth, api, fillIdentity, logout, bindLogout,
    toast, el,
  };
})();
