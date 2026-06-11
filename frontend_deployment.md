# FutureEdge Operations Suite — Frontend Vercel Deployment Guide

This document outlines the configuration, environment variables, and step-by-step instructions to deploy the **FutureEdge React/Vite Frontend** to Vercel and link it to the live Render backend.

---

## 1. Prerequisites
- The backend must be live and operational. Your current backend URL is:
  `https://futureedge-backend-j8ch.onrender.com`
- Your GitHub repository `futureedge-operations-suite` must be fully updated.

---

## 2. Step-by-Step Vercel Deployment

1. **Log in to Vercel:**
   * Go to **[https://vercel.com](https://vercel.com)** and log in using your GitHub account.
2. **Import Repository:**
   * Click **Add New** -> **Project**.
   * Import the `futureedge-operations-suite` repository from your list.
3. **Configure Project Settings:**
   * **Framework Preset:** Select **`Vite`** (Vercel should auto-detect this).
   * **Root Directory:** Edit and set this to **`frontend`** *(⚠️ Crucial: The React code is inside the `frontend` subdirectory).*
   * **Build Command:** `npm run build` *(Default)*
   * **Output Directory:** `dist` *(Default)*
4. **Configure Environment Variables:**
   * Expand the **Environment Variables** section.
   * Add the following key-value pair:

| Key | Value | Notes |
| :--- | :--- | :--- |
| **`VITE_API_URL`** | `https://futureedge-backend-j8ch.onrender.com/api/v1` | Point to your live Render backend API |

5. **Deploy:**
   * Click the **Deploy** button. Vercel will compile the React bundle and deploy it onto their global Edge network.

---

## 3. Post-Deployment Testing Checklist

Once Vercel gives you a public URL (e.g., `https://futureedge-operations-suite.vercel.app`):

1. **Authentication Check:**
   * Visit the Vercel URL in your browser.
   * Log in with:
     * **Email:** `operations@futureedge.edu`
     * **Password:** `admin123`
   * Confirm that the dashboard successfully loads after login (this verifies backend connectivity and token storage).
2. **CRM Check:**
   * Go to the **CRM** page.
   * Verify that the student lead cards load, and you can edit or add a new lead.
3. **AI Assistant Check:**
   * Select a lead in the CRM, click the **AI Assistant** tab.
   * Generate a follow-up email/WhatsApp message using Gemini to ensure the backend Gemini integration works.
4. **Document Automation Check:**
   * Go to **Document Automation**, select a template, click **Preview** and download the generated PDF.
5. **Page Refresh Check:**
   * Navigate to `/crm` or `/settings` and hit refresh (`Cmd+R` / `F5`).
   * Verify that the page loads correctly instead of showing a `404 Not Found` error. (This confirms our `vercel.json` rewrite configuration is active).

---

## 4. Expected Public URL Format
Vercel will assign a default domain in the following format:
`https://futureedge-operations-suite-<username>.vercel.app` or `https://futureedge-operations-suite.vercel.app`.

---

## 5. Post-Deployment CORS Update on Render
Once your Vercel deployment is successful and you have your Vercel URL, update the CORS origins on Render to secure your API.
1. Copy your Vercel URL (e.g., `https://futureedge-operations-suite.vercel.app`).
2. Go to your **Render Dashboard** -> **futureedge-backend** -> **Environment**.
3. Update the **`BACKEND_CORS_ORIGINS`** variable:
   * **Value:** `http://localhost:5173,https://futureedge-operations-suite.vercel.app` *(replace with your actual Vercel URL)*.
4. Save the changes. Render will automatically redeploy the backend with the new CORS rules.
