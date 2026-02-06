live in : community-feed.netlify.app

Quick start (copy-paste ready)

1) Clone the repo and change into the frontend folder

```powershell
git clone <your-repo-url>
cd frontend
```

2) Install dependencies (Windows PowerShell)

```powershell
npm install
```

3) Local development server (Vite)

- Option A: set env in a .env.local file (recommended)

Create a file named `.env.local` in the `frontend` folder with:

```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Then run:

```powershell
npm run dev
```

- Option B: set env inline (PowerShell)

```powershell
$env:VITE_API_BASE_URL = "http://127.0.0.1:8000"; npm run dev
```

Visit `http://localhost:5173` (or the URL Vite shows).

4) Build for production & preview

```powershell
npm run build
npm run preview
```

The production build outputs go to the `dist/` folder.

5) Deploy to Netlify (recommended for static frontend)

- Build command: `npm run build`
- Publish directory: `dist`
- Set environment variable on Netlify: `VITE_API_BASE_URL` with your backend URL (e.g., `https://component-feed-restapi.onrender.com`).
- IMPORTANT: After changing `VITE_API_BASE_URL` in Netlify, use **Clear cache and deploy site** (Site → Deploys → Trigger deploy → Clear cache and deploy site) because Vite bakes env vars at build time.

6) Common troubleshooting

- "Why is the frontend still calling the old backend URL?"
  - Vite injects `VITE_` env vars at build time. You must rebuild (or clear Netlify cache) after changing `VITE_API_BASE_URL`.
- "Login/register fails with 404"
  - Ensure API endpoints include the `/api` prefix and that `VITE_API_BASE_URL` is correct. Example final login URL: `https://.../api/token/`.
- "Passwords not visible or eye icon missing"
  - Ensure you are using the latest build; the eye shows only when a password field is focused or has content.

7) Useful local commands

- Start dev server: `npm run dev`
- Build production: `npm run build`
- Preview built site: `npm run preview`

8) Environment variables (quick summary)

- `VITE_API_BASE_URL` - full backend URL (e.g., `https://component-feed-restapi.onrender.com` or `http://127.0.0.1:8000` for local).
