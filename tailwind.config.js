/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Inter", "ui-sans-serif", "system-ui"],
        body: ["Inter", "ui-sans-serif", "system-ui"],
      },
      colors: {
        // XFA brand colour override – mapped to Tailwind names used by the
        // Invisphere platform so the platform adopts XFA's navy/blue palette
        // without touching Tailwind source files.
        "xfa-navy":    "#0a1628",
        "xfa-navy-mid":"#0f2847",
        "xfa-blue":    "#1a5ea8",
        "xfa-blue-lgt":"#2d79d1",
      },
      boxShadow: {
        "glass": "0 20px 25px -15px rgba(15, 52, 96, 0.45)",
        "xfa":   "0 8px 24px rgba(26, 94, 168, 0.35)",
      },
      backgroundImage: {
        "gradient-glass":
          "linear-gradient(135deg, rgba(10,22,40,0.85) 0%, rgba(15,40,71,0.65) 100%)",
        // XFA-branded blue gradient replaces Invisphere's blue→purple
        "gradient-xfa":
          "linear-gradient(135deg, #1a5ea8 0%, #2d79d1 100%)",
      },
      screens: {
        xs:  "475px",
        "3xl": "1920px",
      },
      spacing: {
        "safe-top":    "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left":   "env(safe-area-inset-left)",
        "safe-right":  "env(safe-area-inset-right)",
      },
    },
  },
  plugins: [],
  // Disables Preflight (CSS reset) so Tailwind doesn't override
  // the XFA homepage styles that come from the original Marex clone.
  corePlugins: {
    preflight: false,
  },
};
