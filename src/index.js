import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

// --- MUDANÇA AQUI ---
document.title = "Escalar - Gestão de Aulas";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
