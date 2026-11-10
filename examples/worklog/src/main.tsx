import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@mdbase-dev/ui/collections.css";
import "./worklog.css";

import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
