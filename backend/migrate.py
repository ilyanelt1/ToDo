import asyncio
import sys
from pathlib import Path

from sqlalchemy import text

from app.database import engine

MIGRATIONS_DIR = Path(__file__).parent / "migrations"


async def _ensure_migrations_table() -> None:
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


async def upgrade() -> None:
    await _ensure_migrations_table()
    async with engine.begin() as connection:
        applied_versions = set(
            (await connection.scalars(text("SELECT version FROM schema_migrations"))).all()
        )
        for migration_path in sorted(MIGRATIONS_DIR.glob("*.up.sql")):
            version = migration_path.name.removesuffix(".up.sql")
            if version in applied_versions:
                print(f"Migration {version} is already applied")
                continue

            await connection.exec_driver_sql(migration_path.read_text(encoding="utf-8"))
            await connection.execute(
                text("INSERT INTO schema_migrations (version) VALUES (:version)"),
                {"version": version},
            )
            print(f"Applied migration {version}")


async def downgrade() -> None:
    await _ensure_migrations_table()
    async with engine.begin() as connection:
        applied_versions = list(
            (
                await connection.scalars(
                    text("SELECT version FROM schema_migrations ORDER BY version DESC")
                )
            ).all()
        )
        for version in applied_versions:
            migration_path = MIGRATIONS_DIR / f"{version}.down.sql"
            if not migration_path.is_file():
                raise RuntimeError(f"Downgrade migration not found: {migration_path}")

            await connection.exec_driver_sql(migration_path.read_text(encoding="utf-8"))
            await connection.execute(
                text("DELETE FROM schema_migrations WHERE version = :version"),
                {"version": version},
            )
            print(f"Reverted migration {version}")


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
