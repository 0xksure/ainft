/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#00ffff", // Cyan
                secondary: "#0a0a0a", // Dark background
                accent: "#00cccc", // Darker cyan for contrast
            },
        },
    },
    plugins: [require("daisyui")],
    daisyui: {
        themes: [
            {
                mytheme: {
                    primary: "#00ffff",
                    secondary: "#0a0a0a",
                    accent: "#00cccc",
                    neutral: "#2a2a2a",
                    "base-100": "#1a1a1a",
                    info: "#3abff8",
                    success: "#36d399",
                    warning: "#fbbd23",
                    error: "#f87272",
                },
            },
        ],
    },
}; 