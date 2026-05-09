# FitnessPro - Backend (Django)

A comprehensive fitness subscription platform with dynamic workout management, meal plans, and Stripe payment integration.

## Features

- 👥 **User Management**: Custom user authentication with JWT tokens
- 💳 **Subscriptions**: Multiple subscription tiers with dynamic features
- 🏋️ **Workouts**: Comprehensive workout library with exercises and tracking
- 🥗 **Meal Plans**: Customized nutrition plans with daily meals
- 💰 **Payments**: Stripe integration for secure payments and subscriptions
- 📊 **Progress Tracking**: Track user fitness journey and statistics
- 🔐 **Security**: JWT authentication, CORS enabled, API key validation

## Tech Stack

- Django 4.2
- Django REST Framework
- PostgreSQL (or SQLite for development)
- Stripe API
- JWT Authentication

## Installation

### Prerequisites

- Python 3.9+
- pip
- Virtual environment

### Setup

1. **Create and activate virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Configure environment variables:**
Copy `.env` file and update with your settings:
```bash
cp .env .env.local
```

Update the following:
- `SECRET_KEY` - Django secret key
- `STRIPE_PUBLIC_KEY` - Your Stripe public key
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret

4. **Run migrations:**
```bash
python manage.py migrate
```

5. **Create superuser:**
```bash
python manage.py createsuperuser
```

6. **Collect static files:**
```bash
python manage.py collectstatic --noinput
```

7. **Run development server:**
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api`

## API Documentation

### Documentation
- Swagger UI: `http://localhost:8000/api/docs/`
- Schema: `http://localhost:8000/api/schema/`

### Authentication Endpoints
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login and get tokens
- `GET /api/auth/user/me/` - Get current user profile
- `POST /api/auth/user/update_profile/` - Update profile
- `POST /api/auth/user/change_password/` - Change password

### Subscription Endpoints
- `GET /api/subscriptions/plans/` - List all plans
- `GET /api/subscriptions/plans/{id}/` - Get plan details
- `GET /api/subscriptions/features/` - List features

### Workout Endpoints
- `GET /api/workouts/workouts/` - List workouts
- `GET /api/workouts/workouts/{id}/` - Get workout details
- `POST /api/workouts/workouts/{id}/mark_complete/` - Mark workout complete
- `GET /api/workouts/categories/` - List categories

### Meal Plan Endpoints
- `GET /api/workouts/meal-plans/` - List meal plans
- `GET /api/workouts/meal-plans/{id}/` - Get meal plan details

### Payment Endpoints
- `POST /api/payments/payments/create_payment_intent/` - Create payment intent
- `POST /api/payments/payments/confirm_payment/` - Confirm payment
- `GET /api/payments/payments/my_payments/` - List user payments
- `POST /api/payments/payments/cancel_subscription/` - Cancel subscription

## Admin Panel

Access Django admin at `http://localhost:8000/admin/` with your superuser credentials.

## Database Models

### Custom User
- Extended user model with fitness-related fields
- Profile customization with goals and preferences

### Subscriptions
- Multiple subscription tiers
- Feature management
- Flexible billing cycles (monthly, quarterly, yearly)

### Workouts
- Categorized workouts
- Exercise tracking
- User progress monitoring

### Meal Plans
- Customized nutrition plans
- Daily meal tracking
- Dietary preferences support

### Payments
- Stripe integration
- Invoice generation
- Refund management

## Stripe Integration

### Payment Flow
1. Create payment intent on backend
2. Confirm payment on frontend
3. Update subscription status
4. Generate invoice

### Testing
Use Stripe test keys for development:
- Test card: `4242 4242 4242 4242`
- Any expiry date and CVC

## Deployment

### Production Checklist
- Set `DEBUG=False`
- Update `ALLOWED_HOSTS`
- Setup PostgreSQL database
- Configure email backend
- Setup Redis for Celery tasks
- Configure HTTPS
- Setup environment variables
- Run migrations
- Collect static files

### Using Gunicorn
```bash
gunicorn fitness_project.wsgi:application --bind 0.0.0.0:8000
```

## CLI Commands

### Create test data
```bash
python manage.py shell
```

Then create subscription plans, workouts, etc.

## Support

For issues and questions, please open an issue on GitHub.

## License

This project is licensed under the MIT License.
