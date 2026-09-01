(() => {
  "use strict";
  const H = window.HocPhi;
  const form = document.getElementById("loginForm");
  const error = document.getElementById("loginError");
  const button = document.getElementById("loginButton");

  if(H.token()) H.redirect("./payment.html");
  if(new URLSearchParams(location.search).has("expired")){
    error.textContent = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    error.hidden = false;
  }
  if(!H.API_BASE){
    error.textContent = "Trang học viên chưa được cấu hình máy chủ.";
    error.hidden = false;
    button.disabled = true;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    if(!username || !password){
      error.textContent = "Nhập đầy đủ tên đăng nhập và mật khẩu.";
      error.hidden = false;
      return;
    }
    error.hidden = true;
    button.disabled = true;
    button.textContent = "Đang đăng nhập...";
    try{
      const data = await H.api("/api/login", {method:"POST", body:JSON.stringify({username, password})});
      H.saveToken(data.token);
      H.saveProfile(data.student);
      H.redirect("./payment.html");
    }catch(err){
      error.textContent = err.message;
      error.hidden = false;
    }finally{
      button.disabled = false;
      button.textContent = "Đăng nhập";
    }
  });
})();
