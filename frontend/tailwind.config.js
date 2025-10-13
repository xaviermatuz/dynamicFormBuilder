/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html", // Vite entry point
        "./src/**/*.{js,ts,jsx,tsx}", // All JS and JSX files in src
    ],
    theme: {
        extend: {
            backgroundImage: {
                abstract: "url('/img/abstract.jpg')",
            },
        },
    },
    plugins: [],
};
