import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173, // You can change the port if needed
        open: true, // Automatically opens browser
    },
    resolve: {
        alias: {
            "@": "/src", // Optional: allows imports like "@/features/dashboard/..."
        },
    },
    css: {
        postcss: "./postcss.config.js",
    },
});
