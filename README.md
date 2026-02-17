# Rent-A-Companion

A comprehensive, production-ready marketplace platform connecting users with verified companions for social events, travel, and more.

## Features

### User Side
- 🔐 Secure authentication with Firebase
- 👤 Profile creation and management
- 🔍 Advanced search and filtering
- 📅 Booking system with availability calendar
- 💳 Secure payments via Razorpay
- 💬 In-app chat functionality
- ⭐ Rating and review system
- ❤️ Wishlist functionality
- 🚨 Panic safety feature
- 📱 Responsive design

### Companion Side
- 📝 KYC submission and verification
- 💰 Set pricing and availability
- 📊 Earnings dashboard
- 📈 Analytics and insights
- 💸 Withdrawal requests
- ✅ Accept/reject bookings

### Admin Panel
- 📊 Dashboard with key metrics
- ✅ Approve/reject companions
- 🚫 Suspend users
- 📋 View and manage bookings
- 💰 Handle refunds
- ⚙️ Commission control
- 📢 View and resolve reports
- 🏅 Manual verification badge

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: MongoDB with Mongoose
- **Image Storage**: Cloudinary
- **Payments**: Razorpay
- **Real-time**: Socket.io

## Prerequisites

- Node.js 18+ 
- MongoDB Atlas account
- Firebase project
- Cloudinary account
- Razorpay account

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/rent-a-companion.git
cd rent-a-companion
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Rent-A-Companion
NODE_ENV=development

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rent-a-companion?retryWrites=true&w=majority
MONGODB_DB_NAME=rent-a-companion

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
JWT_EXPIRES_IN=7d

# Admin
ADMIN_EMAIL=admin@rentacompanion.com
ADMIN_PASSWORD_HASH=your_hashed_admin_password

# Commission & Payment
PLATFORM_COMMISSION_PERCENTAGE=15
MIN_WITHDRAWAL_AMOUNT=500
ESCROW_HOLD_DAYS=1

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CSRF_SECRET=your_csrf_secret_key
```

### 4. Setup Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password, Google)
4. Get your configuration credentials
5. Update the `.env` file with Firebase credentials
6. Generate a service account key for Firebase Admin
7. Add the private key to `.env`

### 5. Setup MongoDB

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user
4. Get your connection string
5. Update the `MONGODB_URI` in `.env`

### 6. Setup Cloudinary

1. Go to [Cloudinary](https://cloudinary.com/)
2. Create a free account
3. Get your cloud name, API key, and API secret
4. Update the `.env` file

### 7. Setup Razorpay

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Create an account
3. Get your API keys
4. Update the `.env` file

### 8. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

```bash
npm run build
```

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com/)
3. Import your repository
4. Add all environment variables
5. Deploy

```bash
# Using Vercel CLI
vercel --prod
```

### Environment Variables for Production

Make sure to update these for production:
- `NEXT_PUBLIC_APP_URL` - Your production domain
- `NODE_ENV` - Set to `production`
- All API keys should be production keys

## Project Structure

```
rent-a-companion/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── admin/             # Admin panel pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── companions/        # Companion listing pages
│   ├── booking/           # Booking pages
│   ├── chat/              # Chat pages
│   ├── profile/           # Profile pages
│   └── share/             # Share profile pages
├── components/            # React components
│   ├── ui/               # UI components
│   ├── forms/            # Form components
│   ├── cards/            # Card components
│   └── layout/           # Layout components
├── hooks/                 # Custom React hooks
├── lib/                   # Library configurations
│   ├── mongodb.ts        # MongoDB connection
│   ├── firebase.ts       # Firebase client config
│   ├── firebase-admin.ts # Firebase admin config
│   ├── cloudinary.ts     # Cloudinary config
│   └── razorpay.ts       # Razorpay config
├── middleware/            # Middleware functions
│   ├── auth.ts           # Authentication middleware
│   ├── rateLimit.ts      # Rate limiting
│   ├── errorHandler.ts   # Error handling
│   └── validation.ts     # Input validation
├── models/                # Mongoose models
│   ├── User.ts
│   ├── Companion.ts
│   ├── Booking.ts
│   ├── Review.ts
│   ├── Report.ts
│   ├── Chat.ts
│   └── Withdrawal.ts
├── types/                 # TypeScript types
├── utils/                 # Utility functions
│   ├── helpers.ts
│   ├── ai.ts
│   └── constants.ts
├── public/                # Static assets
└── scripts/               # Utility scripts
```

## API Routes

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/forgot-password` - Password reset
- `GET /api/auth/me` - Get current user

### User
- `GET /api/user/profile` - Get profile
- `PUT /api/user/profile` - Update profile
- `GET /api/user/wishlist` - Get wishlist
- `POST /api/user/wishlist/:id` - Add to wishlist
- `DELETE /api/user/wishlist/:id` - Remove from wishlist
- `POST /api/user/panic-alert` - Send panic alert
- `GET /api/user/safety-contacts` - Get safety contacts
- `POST /api/user/safety-contacts` - Add safety contact

### Companions
- `GET /api/companions` - List companions
- `POST /api/companions` - Create companion profile
- `GET /api/companions/:slug` - Get companion details
- `PUT /api/companions/:slug` - Update companion
- `GET /api/companions/:slug/availability` - Get availability
- `PUT /api/companions/:slug/availability` - Update availability
- `POST /api/companions/:slug/kyc` - Submit KYC

### Bookings
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings/:id/confirm` - Confirm booking
- `POST /api/bookings/:id/cancel` - Cancel booking
- `POST /api/bookings/:id/start` - Start booking
- `POST /api/bookings/:id/complete` - Complete booking

### Payments
- `POST /api/payments/verify` - Verify payment

### Reviews
- `GET /api/reviews` - List reviews
- `POST /api/reviews` - Create review

### Reports
- `GET /api/reports` - List reports
- `POST /api/reports` - Create report

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/companions` - List all companions
- `POST /api/admin/companions/:id/approve` - Approve companion
- `POST /api/admin/companions/:id/reject` - Reject companion
- `POST /api/admin/users/:id/suspend` - Suspend user
- `GET /api/admin/reports` - List all reports
- `POST /api/admin/reports/:id/resolve` - Resolve report

## Security Features

- 🔒 Firebase Authentication
- 🛡️ Role-based access control
- ⏱️ Rate limiting
- ✅ Input validation with Zod
- 🧹 Input sanitization
- 🚫 CSRF protection
- 🔐 Secure HTTP headers
- 💳 Escrow payment system

## AI Features

- 🎯 Compatibility score calculation
- 🛡️ Content moderation
- 💬 Sentiment analysis
- 💰 Price optimization suggestions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@rentacompanion.com or join our Slack channel.

---

Built with ❤️ by the Rent-A-Companion Team
