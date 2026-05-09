# FitnessPro - Complete Setup Guide

A modern fitness subscription platform with Django backend and React frontend.

## Project Overview

FitnessPro is a comprehensive fitness management system that allows users to:
- Subscribe to different fitness plans
- Access personalized workouts
- Follow meal plans
- Track progress
- Make secure payments via Stripe

## Prerequisites

- Python 3.9+
- Node.js 16+
- PostgreSQL 12+ (optional, SQLite for dev)
- Git
- Stripe account (for payment testing)

## Quick Start

### 1. Backend Setup (Django)

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env .env.local
# Edit .env.local with your settings

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load sample data (optional)
python manage.py loaddata initial_data.json

# Start development server
python manage.py runserver
```

Backend will be available at: `http://localhost:8000`
Admin panel: `http://localhost:8000/admin`
API Documentation: `http://localhost:8000/api/docs`

### 2. Frontend Setup (React)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env .env.local
# Edit .env.local with your settings

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:3000`

## Environment Variables

### Backend (.env)

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# Stripe
STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET

# Email (optional)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY
```

## Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get test keys from Dashboard > API keys
3. Add keys to backend .env file
4. For webhooks, use `http://localhost:8000/api/payments/webhook/stripe/`

Test Card Numbers:
- `4242 4242 4242 4242` - Success
- `4000 0000 0000 0002` - Decline
- Any future expiry date and CVC

## Database Setup

### SQLite (Development)
No additional setup needed. Uses `db.sqlite3` by default.

### PostgreSQL (Production)

```bash
# Install PostgreSQL
# Update DATABASE_URL in .env
DATABASE_URL=postgresql://user:password@localhost:5432/fitness_db

# Install psycopg2
pip install psycopg2-binary

# Run migrations
python manage.py migrate
```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login
- `GET /api/auth/user/me/` - Get current user

### Subscriptions
- `GET /api/subscriptions/plans/` - List plans
- `GET /api/subscriptions/plans/{id}/` - Plan details

### Workouts
- `GET /api/workouts/workouts/` - List workouts
- `GET /api/workouts/workouts/{id}/` - Workout details
- `GET /api/workouts/categories/` - Categories

### Payments
- `POST /api/payments/payments/create_payment_intent/` - Create payment
- `POST /api/payments/payments/confirm_payment/` - Confirm payment

For full API documentation, visit: `http://localhost:8000/api/docs`

## Creating Sample Data

### Via Admin Panel
1. Go to `http://localhost:8000/admin`
2. Login with superuser credentials
3. Add subscription plans, workouts, meal plans

### Via Django Shell

```bash
python manage.py shell
```

```python
from subscriptions.models import SubscriptionPlan

# Create a plan
plan = SubscriptionPlan.objects.create(
    name="Basic",
    description="Basic fitness plan",
    price=9.99,
    duration_days=30,
    billing_cycle="monthly",
    max_workouts_per_week=5
)

# Create workouts, meals, etc.
```

## Testing

### Backend Tests
```bash
python manage.py test
```

### Frontend Tests
```bash
npm test
```

## Deployment

### Backend (Heroku/Railway)

```bash
# Create Procfile
echo "web: gunicorn fitness_project.wsgi" > Procfile

# Create runtime.txt
echo "python-3.11.0" > runtime.txt

# Deploy
git push heroku main
```

### Frontend (Vercel/Netlify)

```bash
npm run build
# Deploy dist folder
```

## Project Structure

```
fitness/
├── backend/
│   ├── fitness_project/          # Main project
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── accounts/                 # User management
│   ├── subscriptions/            # Subscription plans
│   ├── workouts/                 # Workouts & meals
│   ├── payments/                 # Payments & billing
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── .env
│   └── README.md
│
└── README.md
```

## Common Issues & Solutions

### CORS Error
- Check `CORS_ALLOWED_ORIGINS` in backend settings
- Ensure frontend URL is listed

### Authentication Failed
- Verify tokens are stored in localStorage
- Check API URL configuration
- Ensure backend is running

### Stripe Error
- Verify API keys in .env
- Check webhook configuration
- Use test keys for development

### Port Already in Use
```bash
# Find process on port
lsof -i :3000  # Frontend
lsof -i :8000  # Backend

# Kill process
kill -9 <PID>
```

## Documentation

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://react.dev/)
- [Stripe Documentation](https://stripe.com/docs)

## Features Implemented

✅ User authentication with JWT
✅ Multiple subscription tiers
✅ Workout management and tracking
✅ Meal plan system
✅ Stripe payment integration
✅ Progress tracking
✅ Dashboard with statistics
✅ Admin panel
✅ API documentation
✅ Responsive design
✅ Modern UI with Tailwind CSS
✅ Protected routes

## Future Enhancements

- [ ] Video integration for workouts
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] Community features
- [ ] Live classes
- [ ] AI workout recommendations
- [ ] Real-time notifications
- [ ] Social sharing

## Support

For issues and questions:
1. Check documentation
2. Review API docs at `/api/docs`
3. Check console/terminal for errors
4. Open an issue on GitHub

## License

MIT License - feel free to use for personal or commercial projects

## Contributing

Contributions welcome! Please:
1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

---

**Happy Coding! 💪**

Built with ❤️ for fitness enthusiasts
