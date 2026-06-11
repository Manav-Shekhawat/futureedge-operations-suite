# PostgreSQL Migration Guide

This guide details the strategy, model verifications, and seeding steps required to migrate the **FutureEdge** database layer from SQLite to **Neon PostgreSQL** in production.

---

## 1. Database Configuration

The SQLAlchemy database connector in `backend/app/core/database.py` is configured to be dual-compatible. It detects the type of database URL and configures the engine accordingly:

```python
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )
```

In production, you only need to supply a PostgreSQL connection string starting with `postgresql://` (or `postgresql+psycopg2://`) as the `DATABASE_URL` environment variable. The engine automatically enables:
1. **`pool_pre_ping=True`**: Verifies connections before executing queries to prevent stale connection errors (common with serverless hosts like Neon).
2. **`pool_size` & `max_overflow`**: Standard connection pooling configuration suited for production concurrent loads.

---

## 2. Models & Constraints Verification

All database models have been verified for native PostgreSQL compatibility:

* **Primary Keys / IDs:**
  All tables (users, settings, leads, lead_activities, whatsapp_reports, documents) use database-agnostic string UUID primary keys generated in Python:
  `id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))`
  This eliminates any dependency on SQLite-specific autoincrement rules or PostgreSQL native sequence configurations.
* **JSON Fields:**
  The `custom_params`, `analysis_results`, and `data_payload` columns use SQLAlchemy's native `JSON` type. In SQLite, this serializes to strings, while in PostgreSQL, it maps automatically to native `JSONB` for optimized indexing and querying.
* **Date & Time:**
  All DateTime fields specify `timezone=True` and default to `func.now()`, mapping natively to PostgreSQL `TIMESTAMP WITH TIME ZONE`.

---

## 3. Migration Strategy (Step-by-Step)

To deploy schemas onto Neon PostgreSQL:

### Step A: Provision Neon PostgreSQL
1. Sign in to your **[Neon Console](https://neon.tech/)**.
2. Create a new project named `futureedge-ops`.
3. Go to the dashboard and copy the connection string for your database (ensure **Connection Pooling** is enabled to optimize serverless resources). The string will look like:
   `postgresql://alex:pass@ep-glowing-snowflake-12345.us-east-2.aws.neon.tech/neondb?sslmode=require`

### Step B: Apply Schema DDL
Since schema models are defined using SQLAlchemy declarative bases, you can deploy them using python-level table creation or Alembic. 

1. Ensure the dependencies in `requirements.txt` are installed (specifically `psycopg2-binary` which maps PostgreSQL drivers).
2. Run the seeding script directly with the target database URL to generate schemas and mock records at once:
   ```bash
   DATABASE_URL="postgresql://alex:pass@ep-glowing-snowflake-12345.us-east-2.aws.neon.tech/neondb?sslmode=require" venv/bin/python seed.py
   ```
   *Note: `seed.py` calls `Base.metadata.create_all(bind=engine)` which initializes all tables in Neon.*

---

## 4. Verification Check

To confirm that the Neon database is operational and schema tables exist:
1. Connect via the Neon SQL Web Console or `psql` shell.
2. Query table schemas:
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
   ```
   Expected tables:
   * `users`
   * `settings`
   * `leads`
   * `lead_activities`
   * `whatsapp_reports`
   * `documents`
3. Execute a count check to verify seed data exists:
   ```sql
   SELECT COUNT(*) FROM leads; -- Should return 15
   SELECT COUNT(*) FROM users; -- Should return 6
   ```
