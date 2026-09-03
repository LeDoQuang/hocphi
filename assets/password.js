(() => {
  "use strict";
  const H = window.HocPhi;
  H.requireAuth();
  H.fillIdentity();
  H.bindLogout();
  const form = document.getElementById("passwordForm");
  const message = document.getElementById("passwordMessage");
  const button = document.getElementById("passwordButton");
  form.addEventListener("submit", async event => {
    event.preventDefault();
    message.textContent = "";
    const current = document.getElementById("currentPassword").value;
    const next = document.getElementById("newPassword").value;
    const confirm = document.getElementById("confirmPassword").value;
    if (!current || !next || !confirm) {
      message.textContent = "Nhập đầy đủ ba ô mật khẩu.";
      return;
    }
    if (next.length < 6) {
      message.textContent = "Mật khẩu mới phải có ít nhất 6 ký tự.";
      return;
    }
    if (next !== confirm) {
      message.textContent = "Mật khẩu nhập lại chưa khớp.";
      return;
    }
    button.disabled = true;
    button.textContent = "Đang đổi...";
    try {
      const data = await H.api("/api/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: current,
          new_password: next,
          confirm_password: confirm
        })
      });
      H.saveToken(data.token);
      form.reset();
      message.textContent = data.message || "Đổi mật khẩu thành công.";
      H.toast("Đổi mật khẩu thành công");
    } catch (error) {
      message.textContent = error.message;
    } finally {
      button.disabled = false;
      button.textContent = "Đổi mật khẩu";
    }
  });
})();
