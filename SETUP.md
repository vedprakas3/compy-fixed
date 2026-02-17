# Setup Guide - Rent-A-Companion

This guide will walk you through setting up the Rent-A-Companion platform from scratch.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Firebase Configuration](#firebase-configuration)
4. [MongoDB Setup](#mongodb-setup)
5. [Cloudinary Setup](#cloudinary-setup)
6. [Razorpay Setup](#razorpay-setup)
7. [Environment Variables](#environment-variables)
8. [Running the Application](#running-the-application)
9. [Production Deployment](#production-deployment)

## Prerequisites

Before starting, ensure you have:

- Node.js 18.x or higher installed
- npm or yarn package manager
- Git installed
- A code editor (VS Code recommended)

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/rent-a-companion.git
cd rent-a-companion
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Firebase
- Mongoose
- And more...

## Firebase Configuration

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: "Rent-A-Companion"
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Enable the following providers:
   - **Email/Password**: Enable
   - **Google**: Enable and configure
   - (Optional) **Facebook**, **Twitter**

### Step 3: Get Firebase Config

1. Go to Project Settings (gear icon)
2. In "General" tab, scroll to "Your apps"
3. Click "</>" to create a web app
4. Register app with nickname: "Rent-A-Companion Web"
5. Copy the configuration object

### Step 4: Generate Admin SDK Key

1. In Project Settings, go to "Service accounts" tab
2. Click "Generate new private key"
3. Save the JSON file securely
4. Extract these values for your `.env` file:
   - `private_key_id`
   - `private_key` (keep the newlines as `\n`)
   - `client_email`

## MongoDB Setup

### Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Click "Build a Database"

### Step 2: Create Cluster

1. Choose "Shared" (free tier)
2. Select your preferred cloud provider and region
3. Click "Create Cluster"

### Step 3: Configure Database Access

1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter username and generate a secure password
5. Set privileges to "Read and write to any database"
6. Click "Add User"

### Step 4: Configure Network Access

1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
4. For production: Add your server's IP address

### Step 5: Get Connection String

1. Go to "Database" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" driver and version "4.1 or later"
5. Copy the connection string
6. Replace `<password>` with your database user's password
7. Replace `<dbname>` with `rent-a-companion`

## Cloudinary Setup

### Step 1: Create Account

1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for a free account
3. Verify your email

### Step 2: Get Credentials

1. Go to Dashboard
2. You'll see your **Cloud name**, **API Key**, and **API Secret**
3. Copy these values

### Step 3: Configure Upload Settings

1. Go to Settings (gear icon)
2. Under "Upload", you can configure:
   - Upload presets
   - Allowed formats
   - Maximum file size

## Razorpay Setup

### Step 1: Create Account

1. Go to [Razorpay](https://razorpay.com/)
2. Sign up for an account
3. Complete KYC verification (required for live mode)

### Step 2: Get API Keys

1. Go to Razorpay Dashboard
2. Switch to "Test Mode" for development
3. Go to Settings → API Keys
4. Generate new keys
5. Copy Key ID and Key Secret

### Step 3: Configure Webhooks (Production)

1. Go to Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/payments/webhook`
3. Select events: `payment.captured`, `payment.failed`, `refund.processed`

## Environment Variables

Create a `.env` file in the project root:

```bash
touch .env
```

Add the following variables (replace with your actual values):

```env
# ============================================
# App Configuration
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Rent-A-Companion
NODE_ENV=development

# ============================================
# Firebase Configuration (Client)
# ============================================
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=rent-a-companion-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=rent-a-companion-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=rent-a-companion-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# ============================================
# Firebase Admin (Server)
# ============================================
FIREBASE_ADMIN_PROJECT_ID=rent-a-companion-xxxxx
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@rent-a-companion-xxxxx.iam.gserviceaccount.com

# ============================================
# MongoDB
# ============================================
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/rent-a-companion?retryWrites=true&w=majority
MONGODB_DB_NAME=rent-a-companion

# ============================================
# Cloudinary
# ============================================
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_api_secret_here
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name

# ============================================
# Razorpay
# ============================================
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_key_secret_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXX

# ============================================
# JWT Configuration
# ============================================
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d

# ============================================
# Admin Configuration
# ============================================
ADMIN_EMAIL=admin@rentacompanion.com
ADMIN_PASSWORD_HASH=$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ============================================
# Commission & Payment Settings
# ============================================
PLATFORM_COMMISSION_PERCENTAGE=15
MIN_WITHDRAWAL_AMOUNT=500
ESCROW_HOLD_DAYS=1

# ============================================
# Security Configuration
# ============================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CSRF_SECRET=your_csrf_secret_key_here
```

### Important Notes:

1. **Firebase Private Key**: The private key must include newlines. In the `.env` file, replace actual newlines with `\n`.

2. **Admin Password Hash**: Generate this using bcrypt:
   ```bash
   node -e "console.log(require('bcryptjs').hashSync('your-admin-password', 10))"
   ```

3. **JWT Secret**: Use a strong, random string of at least 32 characters.

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Production Deployment

### Vercel Deployment (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

4. **Configure Environment Variables**:
   - Go to Vercel Dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add all variables from your `.env` file
   - Redeploy

### Manual Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Set environment variables** on your server

3. **Start the application**:
   ```bash
   npm start
   ```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t rent-a-companion .
docker run -p 3000:3000 --env-file .env rent-a-companion
```

## Post-Deployment Checklist

- [ ] Update `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Set `NODE_ENV=production`
- [ ] Use production Firebase project
- [ ] Use production Razorpay keys
- [ ] Configure MongoDB IP whitelist for production server
- [ ] Enable Firebase App Check
- [ ] Set up monitoring and logging
- [ ] Configure backups for MongoDB
- [ ] Set up SSL certificate
- [ ] Test all payment flows
- [ ] Verify email notifications

## Troubleshooting

### Common Issues

1. **Firebase Auth Error**: Verify Firebase config and ensure Authentication is enabled
2. **MongoDB Connection Error**: Check IP whitelist and connection string
3. **Cloudinary Upload Error**: Verify API credentials and upload presets
4. **Razorpay Payment Error**: Check if using correct test/live keys

### Getting Help

- Check the [Issues](https://github.com/yourusername/rent-a-companion/issues) page
- Join our [Discord community](https://discord.gg/rentacompanion)
- Email support: support@rentacompanion.com

---

Congratulations! Your Rent-A-Companion platform should now be up and running! 🎉
