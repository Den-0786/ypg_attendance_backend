#!/bin/bash

# YPG Attendance App Deployment Script
echo "🚀 Starting deployment of YPG Attendance App..."

# Check if we're in the right directory
if [ ! -f "manage.py" ]; then
    echo "❌ Error: manage.py not found. Please run this script from the project root."
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Collect static files
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput

# Run database migrations
echo "🗄️ Running database migrations..."
python manage.py migrate

# Create superuser if it doesn't exist (optional)
echo "👤 Checking for superuser..."
python manage.py shell -c "
from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superuser created: admin/admin123')
else:
    print('Superuser already exists')
"

# Check for environment variables
echo "🔧 Checking environment variables..."
if [ -z "$SECRET_KEY" ]; then
    echo "⚠️ Warning: SECRET_KEY not set. Using default for development."
fi

if [ -z "$DEBUG" ]; then
    echo "⚠️ Warning: DEBUG not set. Defaulting to False for production."
fi

# Start the server
echo "🌐 Starting server..."
if [ "$DEBUG" = "True" ]; then
    echo "🔍 Running in DEBUG mode..."
    python manage.py runserver 0.0.0.0:8000
else
    echo "🚀 Running in PRODUCTION mode..."
    gunicorn ypg_backend.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120
fi 