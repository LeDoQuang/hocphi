(() => {
  "use strict";
  const H = window.HocPhi;
  H.requireAuth();
  H.fillIdentity();
  H.bindLogout();

  function renderCharges(charges){
    const root = document.getElementById("chargesList");
    root.replaceChildren();
    if(!charges.length){
      root.append(H.el("div", "empty", "Không còn khoản nào cần thanh toán."));
      return;
    }
    for(const charge of charges){
      const row = H.el("div", "data-row");
      const left = H.el("div");
      left.append(H.el("strong", "", charge.title));
      const details = [];
      if(charge.due_date) details.push(`Hạn đóng: ${H.formatDate(charge.due_date)}`);
      if(charge.note) details.push(charge.note);
      if(details.length) left.append(H.el("span", "meta", details.join(" · ")));
      const right = H.el("div", "row-amount");
      right.append(H.el("strong", "", H.formatVnd(charge.remaining)));
      if(Number(charge.remaining) !== Number(charge.amount)) right.append(H.el("span", "meta", `Khoản gốc ${H.formatVnd(charge.amount)}`));
      row.append(left, right);
      root.append(row);
    }
  }

  H.api("/api/me").then(data => {
    H.saveProfile(data.student);
    H.fillIdentity(data.student);

    document.getElementById("amountDue").textContent = H.formatVnd(data.amount_due);
    document.getElementById("transferContent").textContent = data.payment.transfer_content || "—";

    const configured = Boolean(data.payment.configured);
    const hasQr = Boolean(Number(data.amount_due) > 0 && configured && data.payment.qr_url);
    const qrWrap = document.getElementById("qrWrap");
    const qrImage = document.getElementById("qrImage");
    qrWrap.hidden = !hasQr;
    document.getElementById("paidState").hidden = Number(data.amount_due) > 0;
    if(hasQr){
      qrImage.src = data.payment.qr_url;
      qrImage.onerror = () => H.toast("Không tải được QR. Có thể dùng thông tin chuyển khoản bên dưới.");
    }else{
      qrImage.removeAttribute("src");
    }

    const bank = document.getElementById("bankVerify");
    bank.hidden = !configured;
    if(configured){
      document.getElementById("bankId").textContent = data.payment.bank_id || "—";
      document.getElementById("accountNo").textContent = data.payment.account_no || "—";
      document.getElementById("accountName").textContent = data.payment.account_name || "—";
      document.getElementById("verifyContent").textContent = data.payment.transfer_content || "—";
    }
    renderCharges(data.charges || []);
  }).catch(err => {
    document.getElementById("chargesList").replaceChildren(H.el("div", "empty", err.message));
    H.toast(err.message);
  });
})();
