import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { installAnalytics } from "@/lib/analytics";

installAnalytics();

createRoot(document.getElementById("root")!).render(<App />);