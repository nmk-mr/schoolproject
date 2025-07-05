// vite.config.ts
import { defineConfig, loadEnv } from "file:///C:/Users/Nyan%20Min%20Khant/Documents/LMSApp/mandalay-campus-connect-polish/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Nyan%20Min%20Khant/Documents/LMSApp/mandalay-campus-connect-polish/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///C:/Users/Nyan%20Min%20Khant/Documents/LMSApp/mandalay-campus-connect-polish/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\Nyan Min Khant\\Documents\\LMSApp\\mandalay-campus-connect-polish";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      host: "::",
      port: 8080,
      strictPort: true,
      open: true
    },
    preview: {
      port: 8080,
      strictPort: true
    },
    plugins: [
      react(),
      mode === "development" && componentTagger()
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    // Ensure environment variables are available in the client
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(env.VITE_SUPABASE_URL),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxOeWFuIE1pbiBLaGFudFxcXFxEb2N1bWVudHNcXFxcTE1TQXBwXFxcXG1hbmRhbGF5LWNhbXB1cy1jb25uZWN0LXBvbGlzaFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcTnlhbiBNaW4gS2hhbnRcXFxcRG9jdW1lbnRzXFxcXExNU0FwcFxcXFxtYW5kYWxheS1jYW1wdXMtY29ubmVjdC1wb2xpc2hcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL055YW4lMjBNaW4lMjBLaGFudC9Eb2N1bWVudHMvTE1TQXBwL21hbmRhbGF5LWNhbXB1cy1jb25uZWN0LXBvbGlzaC92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGNvbXBvbmVudFRhZ2dlciB9IGZyb20gXCJsb3ZhYmxlLXRhZ2dlclwiO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICAvLyBMb2FkIGVudiBmaWxlIGJhc2VkIG9uIGBtb2RlYCBpbiB0aGUgY3VycmVudCB3b3JraW5nIGRpcmVjdG9yeS5cbiAgLy8gU2V0IHRoZSB0aGlyZCBwYXJhbWV0ZXIgdG8gJycgdG8gbG9hZCBhbGwgZW52IHJlZ2FyZGxlc3Mgb2YgdGhlIGBWSVRFX2AgcHJlZml4LlxuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCksICcnKTtcbiAgXG4gIHJldHVybiB7XG4gICAgc2VydmVyOiB7XG4gICAgICBob3N0OiBcIjo6XCIsXG4gICAgICBwb3J0OiA4MDgwLFxuICAgICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICAgIG9wZW46IHRydWUsXG4gICAgfSxcbiAgICBwcmV2aWV3OiB7XG4gICAgICBwb3J0OiA4MDgwLFxuICAgICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICB9LFxuICAgIHBsdWdpbnM6IFtcbiAgICAgIHJlYWN0KCksXG4gICAgICBtb2RlID09PSAnZGV2ZWxvcG1lbnQnICYmIGNvbXBvbmVudFRhZ2dlcigpLFxuICAgIF0uZmlsdGVyKEJvb2xlYW4pLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgICAgfSxcbiAgICB9LFxuICAgIC8vIEVuc3VyZSBlbnZpcm9ubWVudCB2YXJpYWJsZXMgYXJlIGF2YWlsYWJsZSBpbiB0aGUgY2xpZW50XG4gICAgZGVmaW5lOiB7XG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfU1VQQUJBU0VfVVJMJzogSlNPTi5zdHJpbmdpZnkoZW52LlZJVEVfU1VQQUJBU0VfVVJMKSxcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWSc6IEpTT04uc3RyaW5naWZ5KGVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZKSxcbiAgICB9LFxuICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXVaLFNBQVMsY0FBYyxlQUFlO0FBQzdiLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFIaEMsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFHeEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxRQUFRLElBQUksR0FBRyxFQUFFO0FBRTNDLFNBQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLFlBQVk7QUFBQSxNQUNaLE1BQU07QUFBQSxJQUNSO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTixZQUFZO0FBQUEsSUFDZDtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sU0FBUyxpQkFBaUIsZ0JBQWdCO0FBQUEsSUFDNUMsRUFBRSxPQUFPLE9BQU87QUFBQSxJQUNoQixTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsTUFDdEM7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUVBLFFBQVE7QUFBQSxNQUNOLHFDQUFxQyxLQUFLLFVBQVUsSUFBSSxpQkFBaUI7QUFBQSxNQUN6RSwwQ0FBMEMsS0FBSyxVQUFVLElBQUksc0JBQXNCO0FBQUEsSUFDckY7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
