#!/bin/bash

# Development Setup Script
# This script ensures the database is properly configured before starting development

set -e

echo "🚀 Setting up development environment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please run 'npm run db:setup' first to create your .env file."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run database migration and seeding
echo "🗄️  Setting up database..."
npm run db:migrate:auto

echo "✅ Development environment ready!"
echo "🎯 Starting development server..."
npm run dev 