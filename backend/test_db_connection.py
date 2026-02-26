import psycopg2
import sys

# Database configurations - update these as needed
DATABASES = {
    "production": {
        "host": "client-questionnaire-prod.croyeu846i7w.eu-west-2.rds.amazonaws.com",
        "port": "5432",
        "dbname": "postgres",
        "user": "postgres",
        "password": "02Fyw;!mE52H",
    },
}


def test_connection(name, config):
    print(f"\n--- {name.upper()} ---")
    print(f"Host: {config['host']}")
    try:
        conn = psycopg2.connect(**config, connect_timeout=10)
        cur = conn.cursor()

        cur.execute("SELECT version();")
        version = cur.fetchone()[0].split(",")[0]
        print(f"Connected! PostgreSQL: {version}")

        cur.execute("SELECT pg_size_pretty(pg_database_size(current_database()));")
        print(f"DB Size: {cur.fetchone()[0]}")

        cur.execute(
            "SELECT count(*) FROM information_schema.tables "
            "WHERE table_schema = 'public';"
        )
        print(f"Tables: {cur.fetchone()[0]}")

        cur.close()
        conn.close()
        return True

    except Exception as e:
        print(f"FAILED: {e}")
        return False


if __name__ == "__main__":
    targets = sys.argv[1:] if len(sys.argv) > 1 else list(DATABASES.keys())

    results = {}
    for name in targets:
        if name.lower() in DATABASES:
            results[name] = test_connection(name, DATABASES[name.lower()])
        else:
            print(f"Unknown environment: {name}")

    print(f"\n--- SUMMARY ---")
    for name, ok in results.items():
        print(f"  {name.upper():12s} {'OK' if ok else 'FAIL'}")


