#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "📌 Waiting for database..."
# Ensure Postgres is ready before running migrations
while ! nc -z $DATABASE_HOST $DATABASE_PORT; do
  sleep 1
done
echo "Database is up."

echo "Applying migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "Starting application..."
exec "$@"
