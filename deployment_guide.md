# Production Deployment Guide

This guide details the exact steps and configurations required to deploy the **FutureEdge Operations Suite** to production services (Vercel, Render, and Neon PostgreSQL) and map custom domains.

---

## 1. Database Setup: Neon PostgreSQL

1. Sign up/log in at **[Neon PostgreSQL](https://neon.tech/)**.
2. Create a new serverless database project named `futureedge-ops`.
3. In the Neon Console, copy your **Connection String** (use the connection-pooled URL, which starts with `postgresql://` and includes `?sslmode=require`).
4. Keep this connection string ready to paste as the backend `DATABASE_URL` environment variable.

---

## 2. Backend Deployment: Render

We will deploy the FastAPI backend as a **Web Service** on **[Render](https://render.com/)**.

### Step-by-Step Configuration:
1. Create a Render account and connect your GitHub repository.
2. Click **New +** and select **Web Service**.
3. Select your repository.
4. Input the service settings:
   * **Name:** `futureedge-backend`
   * **Runtime:** `Python 3`
   * **Build Command:**
     ```bash
     pip install -r requirements.txt
     ```
   * **Start Command:**
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
5. Click **Advanced** to add the following **Environment Variables**:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` | Neon PostgreSQL pooled connection string |
| `JWT_SECRET` | `your-production-jwt-encryption-secret` | Generate using `openssl rand -hex 32` |
| `JWT_ALGORITHM` | `HS256` | Token hashing algorithm |
| `GEMINI_API_KEY` | `AIzaSy...` | Active Google AI Studio API key |
| `BACKEND_CORS_ORIGINS` | `https://futureedge-ops.tech` | Your production frontend URL |
| `ENVIRONMENT` | `production` | Enables production pooling rules |

6. Click **Deploy Web Service**. Render will build the virtualenv, construct database tables automatically on startup, and launch the service.

---

## 3. Frontend Deployment: Vercel

We will deploy the React + TypeScript frontend to **[Vercel](https://vercel.com/)**.

### Step-by-Step Configuration:
1. Log in to Vercel and click **Add New Project**.
2. Select your repository.
3. Configure the build parameters:
   * **Framework Preset:** `Vite`
   * **Root Directory:** `frontend`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
4. Add the **Environment Variables**:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://futureedge-backend.onrender.com/api/v1` | URL pointing to your Render service |

5. Click **Deploy**. Vercel will compile the TypeScript bundle and serve the static files over CDN.

---

## 4. Custom Domain Setup

To map custom domains like `futureedge-ops.tech` or `futureedge-suite.tech`:

### Step A: Configure DNS Records
Log into your domain registrar (GoDaddy, Namecheap, Route53, etc.) and add the following records:

#### 1. Frontend Domain (`futureedge-ops.tech`)
Point the root domain or subdomain to Vercel:
* **Type:** `CNAME`
* **Name:** `@` (or `www`)
* **Value:** `cname.vercel-dns.com.`

#### 2. Backend Subdomain (`api.futureedge-ops.tech`)
Point your backend subdomain to Render:
* **Type:** `CNAME`
* **Name:** `api`
* **Value:** `futureedge-backend.onrender.com`

---

### Step B: SSL Verification
Both Vercel and Render automatically provision and renew Let's Encrypt SSL certificates once DNS records resolve globally:

1. **Vercel:** Go to Project Settings -> Domains, enter `futureedge-ops.tech`, and click Add. Vercel will verify the CNAME records and issue the SSL certificate.
2. **Render:** Go to Web Service Settings -> Custom Domains, enter `api.futureedge-ops.tech`, and click Add. Render will verify DNS records and issue the SSL certificate.
3. **CORS Alignment:** Ensure that `BACKEND_CORS_ORIGINS` in your Render env variables is updated to reference the new HTTPS custom domain: `https://futureedge-ops.tech`.
