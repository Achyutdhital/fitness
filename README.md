# FitnessPro - Your Complete Fitness Platform

A modern, full-stack fitness subscription platform built with Django and React.

## 🎯 Overview

FitnessPro is a comprehensive fitness management system that revolutionizes how people approach their fitness journeys. Users can:

- 📋 **Subscribe** to different fitness plans
- 🏋️ **Access** personalized workout programs
- 🥗 **Follow** customized meal plans
- 📊 **Track** their progress in real-time
- 💳 **Make secure payments** via Stripe

## ✨ Key Features

### User Management
- ✅ Secure JWT authentication
- ✅ Custom user profiles with fitness data
- ✅ Profile customization and goal setting
- ✅ Progress tracking dashboard

### Subscriptions
- ✅ Multiple subscription tiers
- ✅ Dynamic feature management
- ✅ Flexible billing cycles (monthly, quarterly, yearly)
- ✅ Feature comparison tools

### Fitness Content
- ✅ Comprehensive workout library
- ✅ Categorized exercises
- ✅ Detailed meal plans
- ✅ Nutritional tracking
- ✅ Custom workout programs

### Payments
- ✅ Stripe integration
- ✅ Secure payment processing
- ✅ Invoice generation
- ✅ Refund management
- ✅ Subscription management

### Frontend
- ✅ Modern, responsive UI
- ✅ Real-time dashboard
- ✅ Workout browser and tracker
- ✅ Meal plan viewer
- ✅ User profile management

## 🏗️ Architecture

### Backend
- **Framework**: Django 4.2 + Django REST Framework
- **Database**: PostgreSQL (SQLite for dev)
- **Authentication**: JWT tokens
- **Payments**: Stripe API
- **Deployment**: Gunicorn + Nginx

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Context API
- **HTTP Client**: Axios

## 📁 Project Structure

```
fitness/
├── backend/                    # Django REST API
│   ├── fitness_project/        # Main project config
│   ├── accounts/               # User authentication
│   ├── subscriptions/          # Subscription management
│   ├── workouts/               # Fitness content
│   ├── payments/               # Payment handling
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env
│   └── README.md
│
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API services
│   │   ├── context/            # React context
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── .env
│   └── README.md
│
├── SETUP.md                    # Complete setup guide
└── README.md                   # This file
```

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL 12+ (or use SQLite)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# Edit .env with your settings
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install
copy .env.example .env
# Edit .env with your settings
npm run dev
```

### Environment Files

Use the provided example files as templates:

- `backend/.env.example` for Django, Stripe, email, and CORS settings
- `frontend/.env.example` for the Vite API base URL

Keep your real `.env` files local and out of Git.

## 🌐 Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/api/docs |
| Admin Panel | http://localhost:8000/admin |

## 📚 API Documentation

Full API documentation available at: `http://localhost:8000/api/docs`

### Main Endpoints

**Authentication**
```
POST   /api/auth/register/           - Register
POST   /api/auth/login/              - Login
GET    /api/auth/user/me/            - Get profile
```

**Subscriptions**
```
GET    /api/subscriptions/plans/     - List plans
GET    /api/subscriptions/plans/{id}/- Plan details
```

**Workouts**
```
GET    /api/workouts/workouts/       - List workouts
GET    /api/workouts/workouts/{id}/  - Workout details
POST   /api/workouts/workouts/{id}/mark_complete/ - Complete
GET    /api/workouts/categories/     - Categories
```

**Payments**
```
POST   /api/payments/payments/create_payment_intent/  - Create payment
POST   /api/payments/payments/confirm_payment/        - Confirm payment
GET    /api/payments/payments/my_payments/            - Payment history
```

## 🔐 Authentication

The app uses JWT (JSON Web Tokens) for authentication:

1. User registers or logs in
2. Backend returns `access_token` and `refresh_token`
3. Frontend stores tokens in localStorage
4. Each API request includes token in Authorization header
5. Expired tokens are automatically refreshed

## 💳 Stripe Integration

### Setup
1. Create Stripe account
2. Get test keys from Dashboard
3. Add to .env files
4. Test with provided card numbers

### Test Cards
- `4242 4242 4242 4242` - Success
- `4000 0000 0000 0002` - Decline
- `3782 822463 10005` - Amex

### Payment Flow
1. Create payment intent
2. Confirm payment with card details
3. Receive confirmation
4. Update subscription status
5. Generate invoice

## 📊 Data Models

### User
- Custom authentication model
- Profile with fitness metrics
- Subscription status
- Payment history

### Subscription
- Tiered plans (Basic, Pro, Elite)
- Feature management
- Billing configuration
- User assignments

### Workout
- Exercises with instructions
- Categories and difficulty levels
- Duration and calories
- User progress tracking

### Meal Plan
- Daily meals with recipes
- Nutritional information
- Dietary preferences
- User assignments

### Payment
- Transaction records
- Invoice generation
- Refund management
- Subscription lifecycle

## 🌟 Features by Subscription Tier

| Feature | Basic | Pro | Elite |
|---------|-------|-----|-------|
| Workouts/week | 5 | Unlimited | Unlimited |
| Meal Plans | ❌ | ✅ | ✅ |
| Personal Trainer | ❌ | ✅ | ✅ |
| Nutrition Consultation | ❌ | ❌ | ✅ |
| Community Access | ✅ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ✅ |

## 🛠️ Development

### Running Tests
```bash
# Backend
cd backend
python manage.py test

# Frontend
cd frontend
npm test
```

### Code Style
- Backend: PEP 8
- Frontend: ESLint + Prettier

### Building for Production
```bash
# Backend
gunicorn fitness_project.wsgi:application

# Frontend
npm run build
# Deploy dist/ folder
```

## 📦 Dependencies

### Backend
- Django 4.2.11
- djangorestframework 3.14.0
- django-cors-headers 4.0.0
- stripe 5.14.0
- JWT support
- PostgreSQL driver (psycopg2)

### Frontend
- React 18.2.0
- React Router 6.14.0
- Axios 1.4.0
- Stripe Elements
- Tailwind CSS 3.3.0
- React Icons 4.11.0

## 🚀 Deployment

### Backend (Heroku/Railway)
```bash
git push heroku main
```

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy dist folder
```

## 📖 Documentation

- [Backend Setup Guide](./backend/README.md)
- [Frontend Setup Guide](./frontend/README.md)
- [Complete Setup Instructions](./SETUP.md)

## 🐛 Troubleshooting

See [SETUP.md](./SETUP.md#common-issues--solutions) for common issues and solutions.

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file

## 🎓 Learning Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://react.dev/)
- [Stripe Documentation](https://stripe.com/docs)
- [Tailwind CSS](https://tailwindcss.com/)

## 💬 Support

For issues, questions, or suggestions:
1. Check documentation
2. Review API docs
3. Check existing issues
4. Create new issue with details

## 🎯 Roadmap

### v1.0 (Current)
- ✅ User authentication
- ✅ Subscription system
- ✅ Workout management
- ✅ Meal planning
- ✅ Payment processing
- ✅ Dashboard

### v1.1 (Planned)
- [ ] Video streaming
- [ ] Live classes
- [ ] Social features
- [ ] Advanced analytics
- [ ] Mobile app

### v2.0 (Future)
- [ ] AI recommendations
- [ ] Wearable integration
- [ ] Advanced reporting
- [ ] Marketplace

## 👨‍💻 Built By

Created with ❤️ for fitness enthusiasts worldwide.

## 🏆 Key Highlights

- ✅ **Production-ready** code
- ✅ **Fully dynamic** - All content managed via admin panel
- ✅ **Secure** - JWT auth + HTTPS ready
- ✅ **Scalable** - Designed for growth
- ✅ **Responsive** - Works on all devices
- ✅ **Well-documented** - Comprehensive guides
- ✅ **Modern tech** - Latest frameworks
- ✅ **Free** - Open source MIT license

---

**Ready to transform fitness? Start building with FitnessPro today! 💪**

Get started with [SETUP.md](./SETUP.md)
