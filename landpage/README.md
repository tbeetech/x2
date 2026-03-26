# Landpage (public homepage source)

This folder contains the single source of truth for the public landing page. The root file `index.html` is a self-contained version of the homepage (including its CSS, JS, fonts, and images).

When you run `npm run dev` or `npm run build`, the `sync-landpage.mjs` script copies this folder to `public/landpage` so Vite can serve it at `/landpage/index.html`. Edit the files here to update the homepage; no React components need to be touched for content changes.
