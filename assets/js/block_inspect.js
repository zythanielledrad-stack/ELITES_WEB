// block_inspect.js

// Disable right click
document.addEventListener("contextmenu", (e) => e.preventDefault());

// Disable drag
document.addEventListener("dragstart", (e) => e.preventDefault());

// Block dev tools shortcuts
document.addEventListener("keydown", function (e) {

  const key = (e.key || "").toLowerCase();

  if (
    key === "f12" ||
    (e.ctrlKey && e.shiftKey && key === "i") || // DevTools
    (e.ctrlKey && e.shiftKey && key === "j") || // Console
    (e.ctrlKey && key === "c") ||               // copy (optional)
    (e.ctrlKey && key === "u")                  // view source
  ) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
});