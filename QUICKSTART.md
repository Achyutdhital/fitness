# FitnessPro - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Backend Setup

```bash
# Navigate to backend folder
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env file with:
SECRET_KEY=your-secret-key
STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_KEY

# Run migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Start server
python manage.py runserver
```

**Backend running at:** http://localhost:8000

---

### Step 2: Frontend Setup

```bash
# Open new terminal
cd frontend

# Install dependencies
npm install

# Configure environment (.env file)
VITE_API_URL=http://localhost:8000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY

# Start dev server
npm run dev
```

**Frontend running at:** http://localhost:3000

---

## 📝 First Steps

### 1. Admin Panel Setup
1. Go to http://localhost:8000/admin
2. Login with superuser credentials
3. Add subscription plans:
   - Trial ($0/month, Free tier)
   - Basic ($9.99/month, 5 workouts/week)
   - Pro ($19.99/month, Unlimited + Meals)
   - Elite ($29.99/month, All features)

4. Add workouts:
   - Create categories (e.g., Cardio, Strength)
   - Add workouts with exercises

5. Add meal plans:
   - Create meal plans
   - Add daily meals with recipes

### 2. Test User Registration
1. Go to http://localhost:3000
2. Click "Sign Up"
3. Create test account
4. Auto-assigned to Trial plan

### 3. Test Payment Flow
1. Login to dashboard
2. Go to "Plans" or "Subscriptions"
3. Choose a plan
4. Test with Stripe test card: **4242 4242 4242 4242**
5. Any future expiry date and any CVC

---

## 📚 API Documentation

Visit: **http://localhost:8000/api/docs**

### Key Endpoints

**Auth**
- POST `/api/auth/register/` - Sign up
- POST `/api/auth/login/` - Login
- GET `/api/auth/user/me/` - Current user

**Content**
- GET `/api/subscriptions/plans/` - All plans
- GET `/api/workouts/workouts/` - All workouts
- GET `/api/workouts/meal-plans/` - All meal plans

**Payments**
- POST `/api/payments/payments/create_payment_intent/` - Start payment
- POST `/api/payments/payments/confirm_payment/` - Complete purchase

---

## 🔐 Stripe Test Mode

Get test credentials:
1. https://dashboard.stripe.com (Sign in/Sign up)
2. Enable test mode (toggle in top-right)
3. Go to "API Keys"
4. Copy test keys into `.env`

**Test Cards:**
| Card | Status | CVV | Date |
|------|--------|-----|------|
| 4242 4242 4242 4242 | Success | Any | Any Future |
| 4000 0000 0000 0002 | Decline | Any | Any Future |
| 3782 822463 10005 | Amex | Any | Any Future |

---

## 📂 Project Structure

```
fitness/
├── backend/
│   ├── accounts/         # Users & Auth
│   ├── subscriptions/    # Plans & Features
│   ├── workouts/         # Workouts & Meals
│   ├── payments/         # Payments & Billing
│   ├── manage.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── context/
│   ├── package.json
│   └── .env
│
└── README.md
```

---

## ✅ Checklist

### Backend Ready When:
- [ ] `python manage.py runserver` starts successfully
- [ ] http://localhost:8000/admin loads
- [ ] Can create superuser
- [ ] API docs available at /api/docs

### Frontend Ready When:
- [ ] `npm run dev` completes
- [ ] http://localhost:3000 loads
- [ ] Can see landing page
- [ ] Can navigate to login/signup

### Integration Ready When:
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Can see dashboard
- [ ] Can view subscription plans
- [ ] Can see workouts (if added from admin)

---

## 🛠️ Troubleshooting

### Backend won't start
```bash
# Clear cache
find . -type d -name __pycache__ -exec rm -r {} +

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check Python version (need 3.9+)
python --version
```

### Frontend won't start
```bash
# Clear npm cache
npm cache clean --force

# Reinstall modules
rm -rf node_modules package-lock.json
npm install

# Check Node version (need 16+)
node --version
```

### CORS Error
- Check frontend URL in backend `.env` CORS setting
- Default should work: `http://localhost:3000`

### Stripe Error
- Verify keys in `.env` files
- Use TEST keys, not LIVE keys
- Check Stripe account is in test mode

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :8000
kill -9 <PID>
```

---

## 📖 Learn More

- [Full Backend README](./backend/README.md)
- [Full Frontend README](./frontend/README.md)
- [Complete Setup Guide](./SETUP.md)

---

## 🎯 Next Steps

1. ✅ Run both servers
2. ✅ Create admin user
3. ✅ Add sample data from admin panel
4. ✅ Test user registration
5. ✅ Test subscription purchase
6. ✅ Customize styling/content
7. ✅ Deploy to production

---

## 💡 Quick Tips

- **Admin panel** is at `/admin` on backend
- **API docs** are at `/api/docs` on backend  
- **Frontend** auto-reloads when you save files
- **Backend** needs restart when you modify Python files
- **Use browser DevTools** to debug frontend issues
- **Check terminal** for backend error messages

---

## 🎉 You're Ready!

Start exploring the app:
1. http://localhost:3000 (Frontend)
2. http://localhost:8000/admin (Admin Panel)
3. http://localhost:8000/api/docs (API Docs)

**Questions?** Check the README files or troubleshooting section above!

---

**Happy Building! 💪**
