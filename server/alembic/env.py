import sys
from logging.config import fileConfig
from os.path import abspath, dirname

from sqlalchemy import engine_from_config, pool

# Import all model classes to register them in Base.metadata
# Without these imports, Alembic won't know these tables exist and will try to
# DROP them or fail to detect schema changes.
import app.models.doctor  # noqa: F401 — registers Doctor
import app.models.hospital  # noqa: F401 — registers Hospital
import app.models.patient  # noqa: F401 — registers Patient
import app.models.schedule  # noqa: F401 — registers DoctorWeeklySchedule
from alembic import context
from app.config import settings
# Import the single shared Base — this is the SAME object used by all models.
# After the enterprise refactor, all models register themselves in Base.metadata
# by being imported below. Alembic reads Base.metadata to auto-generate migrations.
from app.models.base import Base

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
sys.path.insert(0, dirname(dirname(abspath(__file__))))
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    configuration = config.get_section(config.config_ini_section, {})
    _alembic_url = settings.DATABASE_URL.replace("+asyncpg", "", 1)
    configuration["sqlalchemy.url"] = _alembic_url

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
