# SDF Tours & Travel — Web Application

Full-stack web application for **SDF Tours & Travel** built with **TanStack Start**, **React 19**, **Tailwind CSS v4**, and **Supabase**.

---

## 🚀 Deployment to Render

The application is pre-configured for seamless deployment as a **conventional Node.js server** on [Render](https://render.com/).

### Method 1: Deploy as a Standard Node.js Web Service (Recommended)

1. **Push your code to GitHub / GitLab**.
2. Log in to [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Web Service**.
3. Connect your repository.
4. Configure the service settings:
   - **Name**: `clientwebsite` (or your preferred name)
   - **Language / Runtime**: `Node`
   - **Region**: Choose the region closest to your audience (e.g., `Oregon`, `Frankfurt`)
   - **Branch**: `main`
   - **Build Command**: `npm install --include=dev && npm run build`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   | Key | Value | Description |
   | --- | --- | --- |
   | `NODE_ENV` | `production` | Enables production mode |
   | `NODE_VERSION` | `22` | Specifies Node.js 22 LTS |
   | `VITE_SUPABASE_URL` | `https://bbdzywucatlypfisyymi.supabase.co` | Your Supabase Project URL |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_kNh0v5x9bkaIOA_sZ3GdwQ_Bydmi9R-` | Your Supabase Anon/Publishable Key |
6. Under **Advanced** → **Health Check Path**, enter: `/healthz`
7. Click **Create Web Service**. Render will automatically clone, build, and deploy your site with zero downtime.

---

### Method 2: Deploy using Render Blueprint (`render.yaml`)

This repository contains a ready-to-use [`render.yaml`](./render.yaml) file.

1. In Render Dashboard, click **New +** → **Blueprint**.
2. Select your repository.
3. Render automatically discovers `render.yaml` and sets up the Web Service, build command, start command, and health check.
4. Click **Apply** to launch the deployment.

---

### Method 3: Deploy using Docker

A multi-stage [`Dockerfile`](./Dockerfile) is provided if you prefer containerized deployment:

1. In Render, select **New +** → **Web Service** → Connect repo.
2. Select **Runtime** → **Docker**.
3. Render will automatically build the container and deploy the app on port `10000`.

---

## 🛠️ Architecture & Server

- **Frontend & Routing**: [TanStack Start](https://tanstack.com/router) with full-document SSR, streaming, and pre-rendering.
- **Node.js Production Server**: [`server.js`](./server.js) provides a lightweight, zero-dependency production HTTP server using Node's native `node:http`:
  - Serves static assets from `dist/client` with optimized caching (`Cache-Control: public, max-age=31536000, immutable` for hashed assets).
  - Routes all non-static requests to TanStack Start's SSR handler (`dist/server/server.js` or `dist/server/index.js`).
  - Supports health check probe at `/healthz` and `/health`.
  - Handles `SIGTERM` and `SIGINT` signals for graceful shutdown on cloud platforms.
- **Database & CMS**: [Supabase](https://supabase.com/) for catalog, tours, bookings, and image management.

---

## 💻 Local Development

### 1. Prerequisites
- Node.js 20+ installed (Node 22 recommended).

### 2. Install Dependencies
```bash
npm install
```

### 3. Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 4. Build and Test Production Server Locally
```bash
npm run build
npm start
```
The production server will listen on `http://localhost:3000` (or the port defined in `$PORT`).

---

## ⚙️ Available Scripts

- `npm run dev`: Starts Vite dev server with hot reload.
- `npm run build`: Bundles client assets into `dist/client` and SSR server entry into `dist/server`.
- `npm start`: Runs the Node.js production server (`node server.js`).
- `npm run preview`: Preview the Vite build locally.
- `npm run lint`: Runs ESLint to check for code issues.
