#!/bin/sh

# Exit on error
set -e

echo "Starting AgentCloud Initialization..."

# 1. Generate RSA keys if missing
echo "Checking for JWT RSA keys..."
PYTHONPATH=/app python scripts/generate_keys.py

# 2. Run migrations (only if requested or in certain containers)
# For simplicity, we can try to run it every time in the API container, 
# but it's safer to check an environment variable.
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Running database migrations..."
    PYTHONPATH=/app alembic upgrade head
fi

echo "Initialization complete. Executing: $@"
exec "$@"
