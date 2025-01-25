import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: [
      "df92-2401-4900-1c94-7b2c-353f-ab6d-443c-c024.ngrok-free.app", // Add your ngrok host here
    ],
  },
});
