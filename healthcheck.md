# Production Monitoring & Health Checks

This document details the configuration for automated service health checks and uptime monitoring using **UptimeRobot**.

---

## 1. Health Endpoints

The backend is configured with two public endpoints for verification:

### Root endpoint (`GET /`)
* **Endpoint:** `https://api.futureedge-ops.tech/` (or your Render URL)
* **Response format:**
  ```json
  {
      "message": "FutureEdge API is operational."
  }
  ```

### Database Health Check (`GET /health`)
* **Endpoint:** `https://api.futureedge-ops.tech/health`
* **Purpose:** Verifies that both the FastAPI web server is alive and the SQLAlchemy engine can execute queries on the database (SQLite locally, Neon PostgreSQL in production).
* **Healthy Response:**
  ```json
  {
      "status": "healthy",
      "database": "connected",
      "project": "FutureEdge Education Services API"
  }
  ```
* **Unhealthy Response (Database disconnected):**
  ```json
  {
      "status": "unhealthy",
      "database": "disconnected",
      "error": "Error details trace..."
  }
  ```

---

## 2. UptimeRobot Configuration

To configure automated pings:

1. Log into your **[UptimeRobot Console](https://uptimerobot.com/)**.
2. Click **Add New Monitor**.
3. Configure the monitor details:
   * **Monitor Type:** `HTTP(s)`
   * **Friendly Name:** `FutureEdge Backend API`
   * **URL (or IP):** `https://futureedge-backend.onrender.com/health` (use your actual Render web service endpoint)
   * **Monitoring Interval:** Every `5 minutes` (standard for Render free tier services to prevent sleeping, or `15 minutes` for standard plans).
   * **Timeout:** `30 seconds`
4. Click **Create Monitor**.

---

## 3. Alerts & Incident Notifications
UptimeRobot will notify you immediately via email, Slack, or webhook integrations if the database pings return a status other than `200 OK` (e.g. `500 Internal Server Error` when database connection fails or the web application crashes).
