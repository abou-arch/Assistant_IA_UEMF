import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// En dev, /api est redirigé vers l'API FastAPI (uvicorn api.main:app --port 8000).
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://localhost:8000" } },
});
