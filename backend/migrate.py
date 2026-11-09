import asyncio
import sys
from pathlib import Path

from sqlalchemy import text

from app.database import engine

MIGRATIONS_DIR = Path(__file__).parent / "migrations"
VERSION = "001_create_todos"


async def upgrade() -> None:
    async with engine.begin() as connection:
        await connection.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    version VARCHAR(100) PRIMARY KEY,
                    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
        )
        applied = await connection.scalar(
            text("SELECT version FROM schema_migrations WHERE version = :version"),
            {"version": VERSION},
        )
        if applied:
            print(f"Migration {VERSION} is already applied")
            return

        sql = (MIGRATIONS_DIR / f"{VERSION}.up.sql").read_text(encoding="utf-8")
        await connection.exec_driver_sql(sql)
        await connection.execute(
            text("INSERT INTO schema_migrations (version) VALUES (:version)"),
            {"version": VERSION},
        )
        print(f"Applied migration {VERSION}")


async def downgrade() -> None:
    async with engine.begin() as connection:
        await connection.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    version VARCHAR(100) PRIMARY KEY,
                    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
        )
        applied = await connection.scalar(
            text("SELECT version FROM schema_migrations WHERE version = :version"),
            {"version": VERSION},
        )
        if not applied:
            print(f"Migration {VERSION} is not applied")
            return

        sql = (MIGRATIONS_DIR / f"{VERSION}.down.sql").read_text(encoding="utf-8")
        await connection.exec_driver_sql(sql)
        await connection.execute(
            text("DELETE FROM schema_migrations WHERE version = :version"),
            {"version": VERSION},
        )
        print(f"Reverted migration {VERSION}")


async def main() -> None:
    command = sys.argv[1] if len(sys.argv) > 1 else "upgrade"
    if command == "upgrade":
        await upgrade()
    elif command == "downgrade":
        await downgrade()
    else:
        raise SystemExit("Usage: python migrate.py [upgrade|downgrade]")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
