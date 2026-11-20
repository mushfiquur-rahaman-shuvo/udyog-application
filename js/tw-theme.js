/* Shared Tailwind v4 theme. Loaded in <head> before the Tailwind browser CDN script. */
document.write(`<style type="text/tailwindcss">
@theme {
  --font-sans: "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, sans-serif;
  --font-print: "Kalpurush", "Nirmala UI", sans-serif;

  --color-brand-50: #eef7f1;
  --color-brand-100: #d5ebdd;
  --color-brand-200: #acd7bd;
  --color-brand-300: #7bbd96;
  --color-brand-400: #4c9f6f;
  --color-brand-500: #1f6f4a;
  --color-brand-600: #175c3d;
  --color-brand-700: #124a32;
  --color-brand-800: #0f3d2e;
  --color-brand-900: #0a2a20;

  --color-sun-400: #f7b733;
  --color-sun-500: #f39c12;
  --color-berry-500: #e0312f;

  /* partner (Our Vimganj / Vimverse Lab orange) */
  --color-partner-50: #fff4ec;
  --color-partner-500: #f26b1d;
  --color-partner-600: #d4560d;

  --color-ink: #13201a;
  --color-muted: #5d6b64;
  --color-line: #e3e8e5;
  --color-canvas: #f5f7f6;

  --radius-card: 1.25rem;
  --shadow-card: 0 1px 2px rgb(15 61 46 / 0.04), 0 8px 24px -12px rgb(15 61 46 / 0.12);
}
@layer base {
  html { -webkit-tap-highlight-color: transparent; -webkit-text-size-adjust: 100%; scroll-padding-top: 8rem; }
  input[type="date"] { min-height: 2.875rem; }
  body { @apply bg-canvas text-ink font-sans antialiased; }
  [x-cloak] { display: none !important; }
}
@layer components {
  .btn { @apply inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition select-none whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none; }
  .btn svg { @apply size-4 shrink-0; }
  .btn-primary { @apply bg-brand-800 text-white hover:bg-brand-700 shadow-sm shadow-brand-900/20; }
  .btn-soft { @apply bg-brand-50 text-brand-800 hover:bg-brand-100; }
  .btn-ghost { @apply text-muted hover:bg-black/5 hover:text-ink; }
  .btn-outline { @apply border border-line bg-white text-ink hover:border-brand-300 hover:bg-brand-50; }
  .btn-danger { @apply bg-berry-500/10 text-berry-500 hover:bg-berry-500/15; }
  .btn-icon { @apply h-9 w-9 px-0; }
  .card { @apply bg-white rounded-card border border-line shadow-card; }
  /* 16px on phones so iOS Safari doesn't zoom in on focus */
  .field-input { @apply w-full min-w-0 rounded-xl border border-line bg-white px-3.5 py-2.5 text-base sm:text-[15px] text-ink placeholder:text-muted/60 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10; }
  .field-input[aria-invalid="true"] { @apply border-berry-500/60 focus:ring-berry-500/10; }
  .chip { @apply inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold; }
}
</style>`);

