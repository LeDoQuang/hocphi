(() => {
  "use strict";
  const H = window.HocPhi;
  H.requireAuth();
  H.fillIdentity();
  H.bindLogout();

  const labels = {PRESENT:"Có mặt", ABSENT:"Vắng", LATE:"Muộn", EXCUSED:"Có phép"};
  const classes = {PRESENT:"status-present", ABSENT:"status-absent", LATE:"status-late", EXCUSED:"status-excused"};

  function monthKey(value){ return String(value || "").slice(0, 7); }

  H.api("/api/attendance").then(data => {
    const counts = data.counts || {};
    const stats = document.getElementById("attendanceStats");
    stats.replaceChildren();
    for(const key of ["PRESENT","ABSENT","LATE","EXCUSED"]){
      const box = H.el("div", "stat");
      box.append(H.el("span", "", labels[key]), H.el("strong", "", String(counts[key] || 0)));
      stats.append(box);
    }

    const items = data.items || [];
    const summary = document.getElementById("attendanceSummary");
    const attended = Number(counts.PRESENT || 0) + Number(counts.LATE || 0);
    if(items.length){
      summary.hidden = false;
      summary.replaceChildren(
        H.el("span", "", "Tổng số buổi đã ghi nhận"),
        H.el("strong", "", `${items.length} buổi · ${attended} buổi có học`),
      );
    }

    const root = document.getElementById("attendanceList");
    root.replaceChildren();
    if(!items.length){
      root.append(H.el("div", "empty", "Chưa có dữ liệu điểm danh."));
      return;
    }

    const groups = new Map();
    for(const item of items){
      const key = monthKey(item.date);
      if(!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }

    for(const [key, group] of groups){
      const section = H.el("section", "month-group");
      const title = H.el("div", "month-title");
      title.append(H.el("span", "", H.formatMonth(`${key}-01`)), H.el("span", "", `${group.length} buổi`));
      section.append(title);

      for(const item of group){
        const row = H.el("div", "data-row");
        const left = H.el("div");
        left.append(H.el("strong", "", item.title));
        const meta = [H.formatDate(item.date), item.note || null].filter(Boolean).join(" · ");
        left.append(H.el("span", "meta", meta));
        const right = H.el("div", "row-amount");
        right.append(H.el("span", `status-pill ${classes[item.status] || ""}`, labels[item.status] || item.status));
        row.append(left, right);
        section.append(row);
      }
      root.append(section);
    }
  }).catch(err => {
    document.getElementById("attendanceList").replaceChildren(H.el("div", "empty", err.message));
    H.toast(err.message);
  });
})();
