import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

// Disable right-click globally
document.addEventListener("contextmenu", (e) => e.preventDefault());

// Disable keyboard globally
document.addEventListener("keydown", (e) => {
  e.preventDefault();
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
