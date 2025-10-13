#!/bin/sh
set -e

MAX_RETRIES=30   # ~60 seconds if sleep=2
COUNT=0

if [ -n "$DATABASE_HOST" ] && [ -n "$DATABASE_PORT" ]; then
  echo "Waiting for database at $DATABASE_HOST:$DATABASE_PORT..."
  until nc -z "$DATABASE_HOST" "$DATABASE_PORT"; do
    COUNT=$((COUNT+1))
    if [ $COUNT -ge $MAX_RETRIES ]; then
      echo "Could not reach $DATABASE_HOST:$DATABASE_PORT after $MAX_RETRIES attempts. Starting anyway..."
      break
    fi
    echo "Still waiting for $DATABASE_HOST:$DATABASE_PORT... ($COUNT/$MAX_RETRIES)"
    sleep 2
  done
  echo "Proceeding to start app."
  echo "Running Django migrations..."
  python manage.py migrate --noinput
else
  echo "DATABASE_HOST/PORT not set — skipping wait."
fi

echo "Starting Gunicorn..."
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers 3
