import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@fontsource/instrument-serif/latin-400.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "./globals.css";
import { installAnalytics } from "@/lib/analytics";

installAnalytics();

createRoot(document.getElementById("root")!).render(<App />);