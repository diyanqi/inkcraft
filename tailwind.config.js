/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            fontFamily: {
                'literature': [
                    'Lora',              // 优雅的衬线字体
                    'Noto Serif SC',     // 中文衬线字体
                    'Source Han Serif',  // 思源宋体
                    'serif'
                ],
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}