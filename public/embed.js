(function () {
  var script = document.currentScript;
  if (!script) return;
  var id = script.getAttribute("data-guesthouse");
  if (!id) {
    console.warn("[Meckvy] data-guesthouse is required on the script tag");
    return;
  }
  var base =
    script.getAttribute("data-base") ||
    (script.src ? script.src.replace(/\/embed\.js(?:\?.*)?$/, "") : "");
  if (!base) base = "https://meckvy-bqug.vercel.app";

  var btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", "Contact guesthouse");
  btn.textContent = "Chat / Book";
  btn.style.cssText =
    "position:fixed;right:16px;bottom:16px;z-index:99999;border:0;border-radius:999px;padding:14px 18px;background:#0d6b6e;color:#faf8f4;font:600 14px/1 system-ui,sans-serif;box-shadow:0 8px 24px rgba(20,37,38,.25);cursor:pointer;";

  var panel = document.createElement("div");
  panel.style.cssText =
    "display:none;position:fixed;right:16px;bottom:72px;z-index:99999;width:min(380px,calc(100vw - 24px));height:560px;border-radius:16px;overflow:hidden;box-shadow:0 16px 40px rgba(20,37,38,.28);background:#fff;";

  var iframe = document.createElement("iframe");
  iframe.src = base + "/widget/" + encodeURIComponent(id) + "?embed=1";
  iframe.title = "Meckvy contact";
  iframe.style.cssText = "border:0;width:100%;height:100%;";
  panel.appendChild(iframe);

  btn.addEventListener("click", function () {
    var open = panel.style.display === "block";
    panel.style.display = open ? "none" : "block";
    btn.textContent = open ? "Chat / Book" : "Close";
  });

  document.body.appendChild(panel);
  document.body.appendChild(btn);
})();
