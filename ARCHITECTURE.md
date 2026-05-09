# FitnessPro - Architecture & System Design

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ React Application (Port 3000)                                │ │
│  │ - Landing Page                                               │ │
│  │ - Authentication (Login/Register)                           │ │
│  │ - Dashboard (Stats, Quick Actions)                          │ │
│  │ - Workout Browser & Tracker                                 │ │
│  │ - Meal Plans                                                │ │
│  │ - User Profile                                              │ │
│  │ - Subscription Management                                   │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              ▲                                       │
│                              │ JSON (HTTP/REST)                      │
│                              ▼                                       │
└─────────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴──────────┐
                    │                      │
                    ▼                      ▼
         ┌──────────────────┐   ┌─────────────────────┐
         │  Stripe API      │   │   Django REST API   │
         │  (Payment)       │   │   (Port 8000)       │
         └──────────────────┘   └─────────────────────┘
                    ▲                      │
                    │                      │
                    └──────────┬───────────┘
                              │
                ┌─────────────┴────────────┐
                │                          │
                ▼                          ▼
    ┌────────────────────┐      ┌──────────────────────┐
    │   Stripe Server    │      │  Django Application  │
    │  - Payments        │      │  - REST Endpoints    │
    │  - Webhooks        │      │  - Validation        │
    │  - Subscriptions   │      │  - Business Logic    │
    └────────────────────┘      └──────────────────────┘
                                         │
                ┌────────────────────────┼────────────────────────┐
                │                        │                        │
                ▼                        ▼                        ▼
    ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐
    │  Django ORM          │  │  Authentication      │  │  Admin Panel     │
    │  - Models            │  │  - JWT Tokens        │  │  - Data Entry    │
    │  - Queries           │  │  - User Sessions     │  │  - Analytics     │
    └──────────────────────┘  └──────────────────────┘  └──────────────────┘
                                         │
                                         ▼
                            ┌──────────────────────┐
                            │  SQLite / PostgreSQL │
                            │  Database            │
                            │                      │
                            │  - Users             │
                            │  - Subscriptions     │
                            │  - Workouts          │
                            │  - Meals             │
                            │  - Payments          │
                            └──────────────────────┘
```

## 📊 Database Schema

```
Users
├── CustomUser
│   ├── id (UUID)
│   ├── username
│   ├── email
│   ├── password_hash
│   ├── fitness_level
│   ├── age, weight, height
│   └── [timestamps]
├── UserSubscription
│   ├── id (UUID)
│   ├── user_id (FK)
│   ├── subscription_plan_id (FK)
│   ├── status (active/trial/canceled)
│   ├── stripe_subscription_id
│   └── [timestamps]
└── UserProfile
    ├── id (UUID)
    ├── user_id (FK)
    ├── goals
    ├── dietary_preferences
    └── injuries

Subscriptions
├── SubscriptionPlan
│   ├── id (UUID)
│   ├── name (Basic, Pro, Elite)
│   ├── price
│   ├── features (JSON)
│   ├── max_workouts_per_week
│   ├── include_meal_plans
│   └── [timestamps]
└── Feature
    ├── id (UUID)
    ├── name
    ├── category
    └── description

Fitness Content
├── WorkoutCategory
│   ├── id (UUID)
│   └── name
├── Workout
│   ├── id (UUID)
│   ├── title
│   ├── category_id (FK)
│   ├── difficulty_level
│   ├── duration_minutes
│   └── [related data]
├── Exercise
│   ├── id (UUID)
│   ├── workout_id (FK)
│   ├── sets, reps
│   └── instructions
├── MealPlan
│   ├── id (UUID)
│   ├── title
│   ├── dietary_type
│   └── [nutritional info]
├── Meal
│   ├── id (UUID)
│   ├── meal_plan_id (FK)
│   ├── day
│   ├── meal_type
│   └── nutritional_data
└── UserWorkoutProgress
    ├── id (UUID)
    ├── user_id (FK)
    ├── workout_id (FK)
    ├── completed (bool)
    └── calories_burnt

Payments
├── Payment
│   ├── id (UUID)
│   ├── user_id (FK)
│   ├── subscription_plan_id (FK)
│   ├── amount
│   ├── status
│   ├── stripe_payment_id
│   └── [timestamps]
├── Invoice
│   ├── id (UUID)
│   ├── user_id (FK)
│   ├── invoice_number
│   ├── status
│   └── [dates]
└── Refund
    ├── id (UUID)
    ├── payment_id (FK)
    ├── amount
    └── reason
```

## 🔄 API Flow Diagram

### User Registration Flow
```
Frontend                Backend              Database
   │                       │                    │
   │─ POST /register ──────→│                    │
   │                       │─ Validate data ───→│
   │                       │─ Hash password ────│
   │                       │─ Create user ─────→│
   │                       │─ Create profile ───→
   │                       │─ Create subscription→
   │                       │                    │
   │←─ Return JWT tokens ──│                    │
   │
```

### Payment Flow
```
Frontend                Backend              Stripe         Database
   │                       │                    │              │
   │─ Select plan ────────→│                    │              │
   │                       │─ Create intent ───→│              │
   │←─ Return secret ──────│←─ Return secret ───│              │
   │                       │                    │              │
   │─ Submit card ────────→│                    │              │
   │  (Stripe.js)          │─ Confirm ─────────→│              │
   │                       │←─ Confirmed ──────│              │
   │                       │                    │              │
   │                       │─ Create payment ──→│
   │                       │─ Update subscription──→
   │                       │─ Generate invoice ──│ 
   │                       │                    │
   │←─ Success message ────│                    │
```

### Content Access Flow
```
Frontend              Backend              Database
   │                    │                    │
   │─ GET /workouts ───→│                    │
   │                    │─ Check subscription→│
   │                    │─ Filter content ───│
   │                    │─ Get workouts ────→│
   │                    │└─ Return results ──│
   │                    │                    │
   │←─ JSON data ───────│                    │
   │                    │                    │
   │─ Mark complete ───→│                    │
   │                    │─ Create progress ─→│
   │←─ Confirmed ───────│                    │
```

## 🔐 Authentication Flow

```
1. Registration
   - User submits email, password, username
   - Backend hashes password with Django's hasher
   - Creates CustomUser and related profiles
   - Returns JWT tokens

2. Login
   - User submits username/email + password
   - Backend validates credentials
   - Creates access_token (24h) & refresh_token (7d)
   - Frontend stores in localStorage
   - Subsequent requests include Authorization header

3. API Requests
   - Frontend adds: Authorization: Bearer {access_token}
   - Middleware verifies token signature
   - Checks token expiration
   - Returns user data or refreshes token

4. Logout
   - Frontend removes tokens from localStorage
   - User redirected to login page
```

## 💳 Payment Processing

```
1. Initiate Payment
   - User selects subscription plan
   - Frontend requests payment intent
   - Backend creates Stripe customer
   - Backend creates payment intent
   - Returns client_secret

2. Card Details
   - Frontend uses Stripe.js to handle card input
   - Stripe tokenizes card (never sent to backend)
   - Frontend confirms payment

3. Process Payment
   - Backend receives confirmation
   - Verifies payment status with Stripe
   - Creates Payment record
   - Updates UserSubscription
   - Generates Invoice
   - Updates plan status to 'active'

4. Webhook Events
   - Stripe sends webhook on success/failure
   - Backend processes event
   - Updates database accordingly
   - Handles subscriptions and renewals
```

## 📊 Request/Response Format

### Successful Response
```json
{
  "data": {
    "id": "uuid",
    "name": "Beginner Workout",
    "completed": true
  },
  "status": 200,
  "message": "Success"
}
```

### Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  },
  "status": 400
}
```

## 🔌 API Endpoint Categories

### Authentication (`/auth/`)
- `POST register/` - Create new user
- `POST login/` - Get JWT tokens
- `GET user/me/` - Current user profile
- `POST user/change_password/` - Change password
- `POST user/update_profile/` - Update profile

### Subscriptions (`/subscriptions/`)
- `GET plans/` - List all plans
- `GET plans/{id}/` - Plan details
- `GET features/` - Available features
- `GET plans/compare/` - Compare all plans

### Workouts (`/workouts/`)
- `GET workouts/` - List workouts
- `GET workouts/{id}/` - Workout details
- `POST workouts/{id}/mark_complete/` - Mark complete
- `GET categories/` - Workout categories
- `GET progress/` - User progress
- `GET progress/stats/` - User statistics
- `GET meal-plans/` - List meal plans

### Payments (`/payments/`)
- `POST payments/create_payment_intent/` - Start payment
- `POST payments/confirm_payment/` - Confirm/complete
- `GET payments/my_payments/` - Payment history
- `POST payments/cancel_subscription/` - Cancel plan
- `POST payments/create_refund/` - Request refund

### Webhooks (`/payments/webhook/stripe/`)
- Handles Stripe events
- Updates subscriptions
- Processes refunds
- Sends notifications

## 🔄 Data Flow Example

### User Views Workouts
```
1. Frontend requests: GET /api/workouts/workouts/
2. Middleware checks JWT token
3. Backend loads user from token
4. Checks user subscription status
5. Filters workouts per subscription level
6. Applies search/filter parameters
7. Returns paginated results
8. Frontend renders workout list
```

### User Completes Workout
```
1. Frontend sends: POST /api/workouts/{id}/mark_complete/
   with: {completed: true, calories_burnt: 300}
2. Backend validates user owns access
3. Creates/updates UserWorkoutProgress
4. Calculates stats
5. Updates user statistics
6. Returns success response
7. Frontend updates dashboard
```

## 📈 Scalability Considerations

### Current Setup (Development)
- SQLite database
- Single Django server
- No caching
- Synchronous tasks

### Production Improvements
- PostgreSQL database
- Gunicorn + multiple workers
- Redis caching
- Celery for async tasks
- CloudFront CDN
- Load balancer
- Database replication

## 🛡️ Security Features

- JWT token-based auth
- Password hashing (PBKDF2)
- CORS configuration
- HTTPS in production
- SQL injection prevention (ORM)
- CSRF protection
- XSS prevention
- Rate limiting ready
- Input validation
- Secure headers

## 📱 Frontend Architecture

```
React App
├── Context API (AuthContext)
│   └── Global auth state
├── Components
│   ├── Layout (Navbar, Footer)
│   ├── Forms (Login, Register)
│   └── Content (Workouts, Plans)
├── Pages
│   ├── Public (Landing, Login)
│   └── Protected (Dashboard, Workouts)
├── Services
│   └── API (Axios wrapper)
└── Styling
    └── Tailwind CSS + custom
```

## 🔄 Component Lifecycle

```
App Mounts
├── AuthProvider wraps app
├── Check localStorage for token
├── Fetch user if token exists
└── Routes render based on auth

User Navigates
├── Route matches component
├── Protected routes check auth
├── Component mounts
├── Fetch data from API
├── Render with data
└── Update on user action
```

## 📡 Real-time Features (Ready for)

- WebSocket for live notifications
- Subscription status updates
- Payment confirmations
- Workout sync across devices
- Real-time rankings/leaderboards

---

**This architecture is designed to be:**
- ✅ Scalable
- ✅ Maintainable
- ✅ Secure
- ✅ User-friendly
- ✅ Developer-friendly
