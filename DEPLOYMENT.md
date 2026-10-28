# Deployment Guide — Amol Marble Murti Bhandar (Murti Hub)

This repository is configured for production deployments on both **Docker** and **Vercel**.

---

## 🚀 Option 1: Deploy to Vercel (Recommended for Cloud Hosting)

The project includes an optimized [`vercel.json`](file:///d:/AIRA%20%28Intenship/client%20delivery/Murti%20hub/vercel.json) tailored for Vite + React SPAs, complete with:
- Client-side SPA routing (`rewrites` to `/index.html`)
- Immutable caching for hashed assets in `/assets/`
- Byte-range streaming headers for the showroom MP4 walkthrough video
- Enterprise HTTP security headers (`nosniff`, `SAMEORIGIN`, etc.)

### Method A: Deploy via GitHub (1-Click & Auto Deploy on Push)
1. Push this repository to GitHub or GitLab:
   ```bash
   git init
   git add .
   git commit -m "feat: complete Murti Hub application ready for deployment"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Vercel will automatically detect **Vite** as the framework:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Click **"Deploy"**. Your live store URL will be ready within 1 minute with global CDN edge routing and SSL.

### Method B: Deploy via Vercel CLI
If you have Vercel CLI installed globally:
```bash
npm install -g vercel
vercel login
vercel
```
To deploy directly to production:
```bash
vercel --prod
```

---

## 🐳 Option 2: Run / Deploy with Docker

The project contains a production-grade multi-stage [`Dockerfile`](file:///d:/AIRA%20%28Intenship/client%20delivery/Murti%20hub/Dockerfile), [`nginx.conf`](file:///d:/AIRA%20%28Intenship/client%20delivery/Murti%20hub/nginx.conf), [`.dockerignore`](file:///d:/AIRA%20%28Intenship/client%20delivery/Murti%20hub/.dockerignore), and [`docker-compose.yml`](file:///d:/AIRA%20%28Intenship/client%20delivery/Murti%20hub/docker-compose.yml).

### Architecture:
- **Build Stage**: Compiles the Vite React application inside a lightweight `node:20-alpine` container.
- **Runner Stage**: Serves compiled static assets through high-performance `nginx:alpine` with gzip compression, byte-range video streaming, and SPA routing fallback.
- **Total Image Size**: ~25 MB compressed.

### Using Docker Compose (Simplest)
```bash
# Build and run container in background
docker compose up -d --build

# View container logs
docker compose logs -f

# Stop container
docker compose down
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Using Standard Docker CLI
```bash
# 1. Build the image
docker build -t murti-hub:latest .

# 2. Run the container on port 3000
docker run -d --name murti-hub-app -p 3000:80 --restart unless-stopped murti-hub:latest

# 3. Check health status
docker ps
```

### Deploying Docker Image to Cloud:
The built image can be deployed immediately to:
- **AWS ECS / App Runner**
- **Google Cloud Run**
- **DigitalOcean App Platform**
- **Render / Railway / Fly.io**
- **Any VPS (Ubuntu/Debian) running Docker**

---

## 🛠️ Verification Checklist

- [x] Production build passes with `npm run build` (`dist/` created with 0 errors)
- [x] All 20+ Makrana marble product images and video assets bundled in `public/` and `dist/`
- [x] SPA client-side routing fallback configured in both `nginx.conf` (`try_files`) and `vercel.json` (`rewrites`)
- [x] Gzip compression enabled for ultra-fast First Contentful Paint (FCP)
- [x] Mobile-first layout fully verified and tested on 390px mobile viewports
