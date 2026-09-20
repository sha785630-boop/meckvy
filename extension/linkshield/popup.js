const apiInput = document.getElementById("apiBase");
const saveBtn = document.getElementById("save");

chrome.storage.local.get(["apiBase", "clientId"], (data) => {
  apiInput.value = data.apiBase || "http://localhost:3000";
});

saveBtn.addEventListener("click", () => {
  chrome.storage.local.set({ apiBase: apiInput.value.trim() }, () => {
    saveBtn.textContent = "Saved!";
    setTimeout(() => (saveBtn.textContent = "Save"), 1500);
  });
});
