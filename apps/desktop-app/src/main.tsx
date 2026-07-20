import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

// Disable right-click globally
document.addEventListener("contextmenu", (e) => e.preventDefault());

// Disable keyboard globally
document.addEventListener("keydown", (e) => {
  // Allow reload (F5 / Ctrl+R) and DevTools (F12 / Ctrl+Shift+I) for debugging if needed
  // But the prompt says "remove keyboard support entirely"
  e.preventDefault();
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
