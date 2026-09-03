(() => {
  "use strict";
  const API_BASE = String(window.HOCPHI_CONFIG?.API_BASE || "").replace(/\/$/, "");
  const TOKEN_KEY = "hocphi_student_token_v1";
  const PROFILE_KEY = "hocphi_student_profile_v1";
  const APP_ROOT = new URL("../", document.currentScript.src);
  function token() {
    return localStorage.getItem(TOKEN_KEY) || "";
  }
  function saveToken(value) {
    localStorage.setItem(TOKEN_KEY, String(value || ""));
  }
  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
  }
  function saveProfile(student) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(student || {}));
  }
  function profile() {
    try {
      return JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
    } catch {
      return {};
    }
  }
  function appUrl(path = "") {
    const cleanPath = String(path || "").replace(/^\/+/, "");
    return new URL(cleanPath, APP_ROOT).href;
  }
  function redirect(path) {
    window.location.replace(appUrl(path));
  }
  function requireAuth() {
    if (!token()) redirect("");
  }
  function requireConfig() {
    if (!API_BASE) throw new Error("Trang học viên chưa được cấu hình máy chủ.");
  }
  function formatVnd(value) {
    return `${new Intl.NumberFormat("vi-VN").format(Number(value || 0))} đ`;
  }
  function formatDate(value) {
    if (!value) return "—";
    const parts = String(value).split("-");
    if (parts.length !== 3) return String(value);
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  function formatMonth(value) {
    if (!value) return "Không rõ tháng";
    const parts = String(value).split("-");
    if (parts.length < 2) return String(value);
    return `Tháng ${Number(parts[1])}/${parts[0]}`;
  }
  async function api(path, options = {}) {
    requireConfig();
    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", "application/json");
    if (token()) headers.set("Authorization", `Bearer ${token()}`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let response;
    try {
      response = await fetch(API_BASE + path, {
        ...options,
        headers,
        signal: controller.signal,
        cache: "no-store"
      });
    } catch (error) {
      if (error?.name === "AbortError") throw new Error("Máy chủ phản hồi quá lâu. Vui lòng thử lại.");
      throw new Error("Không kết nối được máy chủ học phí.");
    } finally {
      clearTimeout(timeout);
    }
    let data = {};
    try {
      data = await response.json();
    } catch {}
    if (response.status === 401 && path !== "/api/login") {
      clearToken();
      redirect("?expired=1");
      throw new Error("Phiên đăng nhập đã hết hạn");
    }
    if (!response.ok) throw new Error(data?.detail || `Máy chủ trả lỗi ${response.status}`);
    return data;
  }
  function fillIdentity(student) {
    const currentProfile = student || profile();
    document.querySelectorAll("[data-student-name]").forEach(node => {
      node.textContent = currentProfile.full_name || "Học viên";
    });
    document.querySelectorAll("[data-student-code]").forEach(node => {
      node.textContent = currentProfile.payment_code || "—";
    });
  }
  function logout() {
    clearToken();
    redirect("");
  }
  function bindLogout() {
    document.querySelectorAll("[data-logout]").forEach(button => {
      button.addEventListener("click", logout);
    });
  }
  function toast(message) {
    document.querySelector(".toast")?.remove();
    const node = document.createElement("div");
    node.className = "toast";
    node.setAttribute("role", "status");
    node.textContent = message;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 3200);
  }
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  window.HocPhi = {
    API_BASE,
    token,
    saveToken,
    clearToken,
    saveProfile,
    profile,
    appUrl,
    redirect,
    requireAuth,
    requireConfig,
    formatVnd,
    formatDate,
    formatMonth,
    api,
    fillIdentity,
    logout,
    bindLogout,
    toast,
    el
  };
})();
