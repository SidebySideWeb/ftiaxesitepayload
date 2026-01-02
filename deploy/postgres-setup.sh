#!/bin/bash
# PostgreSQL Database Setup Script for Hetzner
# Run this script on your Hetzner server to set up the database

set -e

echo "🗄️  Setting up PostgreSQL database for Payload CMS..."

# Get database credentials
read -p "Enter database name (default: cmsftiaxesite): " DB_NAME
DB_NAME=${DB_NAME:-cmsftiaxesite}

read -p "Enter database user (default: payload): " DB_USER
DB_USER=${DB_USER:-payload}

read -sp "Enter database password: " DB_PASSWORD
echo ""

read -p "Enter PostgreSQL superuser (default: postgres): " PG_USER
PG_USER=${PG_USER:-postgres}

# Create database
echo "📦 Creating database: $DB_NAME..."
sudo -u $PG_USER psql << EOF
CREATE DATABASE $DB_NAME;
EOF

# Create user
echo "👤 Creating user: $DB_USER..."
sudo -u $PG_USER psql << EOF
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
ALTER USER $DB_USER CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

# Set up extensions (if needed)
echo "🔧 Setting up database extensions..."
sudo -u $PG_USER psql -d $DB_NAME << EOF
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
EOF

echo "✅ Database setup complete!"
echo ""
echo "📋 Database connection string:"
echo "postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
echo ""
echo "⚠️  Add this to your .env file as DATABASE_URI"
