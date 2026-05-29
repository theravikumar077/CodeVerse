/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // VS Code style color mapping
        vscode: {
          editor: 'var(--editor-bg)',
          sidebar: 'var(--sidebar-bg)',
          activity: 'var(--activity-bg)',
          status: 'var(--status-bg)',
          tabActive: 'var(--tab-active-bg)',
          tabInactive: 'var(--tab-inactive-bg)',
          terminal: 'var(--terminal-bg)',
          border: 'var(--border-color)',
          text: 'var(--text-color)',
          textMuted: 'var(--text-muted)',
          accent: 'var(--accent-color)',
          accentHover: 'var(--accent-hover)',
        }
      },
      fontFamily: {
        vscode: ['Outfit', 'Inter', 'Fira Code', 'Consolas', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
