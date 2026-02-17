#!/bin/bash

# Git Setup Script for Rent-A-Companion
# This script initializes git repository and makes the initial commit

echo "=========================================="
echo "Rent-A-Companion Git Setup"
echo "=========================================="

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Error: Git is not installed. Please install Git first."
    exit 1
fi

# Initialize git repository
echo "Initializing Git repository..."
git init

# Add all files
echo "Adding files to git..."
git add .

# Create initial commit
echo "Creating initial commit..."
git commit -m "feat: production-ready Rent-A-Companion platform

- Complete marketplace platform with user, companion, and admin roles
- Firebase authentication with email/password and Google OAuth
- MongoDB database with Mongoose ODM
- Cloudinary image storage
- Razorpay payment integration with escrow system
- Real-time chat with Socket.io
- AI-powered compatibility scoring and content moderation
- Role-based access control and security middleware
- Rate limiting and input validation
- Comprehensive API routes for all features
- Responsive UI with Tailwind CSS
- Production-ready deployment configuration"

# Create main branch (if not already on it)
git branch -M main

echo ""
echo "=========================================="
echo "Git repository initialized successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Create a repository on GitHub"
echo "2. Run: git remote add origin https://github.com/YOUR_USERNAME/rent-a-companion.git"
echo "3. Run: git push -u origin main"
echo ""
echo "Or use GitHub CLI:"
echo "gh repo create rent-a-companion --public --source=. --push"
echo ""
