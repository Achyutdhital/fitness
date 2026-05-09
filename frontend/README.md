# FitnessPro - Frontend (React)

A modern, responsive fitness subscription platform built with React and Vite.

## Features

- 🎨 **Modern UI**: Clean and intuitive user interface with Tailwind CSS
- 📱 **Responsive**: Works seamlessly on desktop, tablet, and mobile
- 🔐 **Secure Auth**: JWT-based authentication with protected routes
- 💳 **Stripe Integration**: Secure payment processing
- 📊 **Dashboard**: Real-time progress tracking and statistics
- 🏋️ **Workout Library**: Browse and track workouts
- 🥗 **Meal Plans**: View and follow meal plans
- 👤 **User Profiles**: Customize preferences and goals

## Tech Stack

- React 18
- Vite
- React Router v6
- Axios
- Tailwind CSS
- Stripe JS
- React Icons

## Installation

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
Create `.env` file:
```bash
cp .env .env.local
```

Update the following:
```env
VITE_API_URL=http://localhost:8000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY
```

3. **Start development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   └── ProtectedRoute.jsx
├── pages/              # Page components
│   ├── LandingPage.jsx
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx
│   ├── WorkoutsPage.jsx
│   └── ...
├── services/           # API services
│   └── api.js
├── context/            # React context
│   └── AuthContext.jsx
├── App.jsx             # Main app component
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## Key Components

### AuthContext
Manages authentication state globally:
- User data
- Login/Register
- Token management
- Subscription info

### API Service
Axios instance with:
- Authorization header injection
- Error handling
- Automatic token refresh
- Base URL configuration

### Protected Routes
Routes that require authentication:
- Dashboard
- Workouts
- Meal Plans
- Payment
- Profile

## Available Routes

### Public Routes
- `/` - Landing page
- `/login` - Login page
- `/register` - Registration page
- `/subscriptions` - Plans and pricing

### Protected Routes
- `/dashboard` - User dashboard
- `/workouts` - Browse workouts
- `/workouts/:id` - Workout details
- `/meal-plans` - Browse meal plans
- `/payment` - Payment page
- `/profile` - User profile

## Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## API Integration

### Authentication
```javascript
// Login
const response = await authAPI.login(username, password);

// Register
const response = await authAPI.register(userData);

// Get profile
const user = await authAPI.getProfile();
```

### Workouts
```javascript
// Get workouts with filters
const workouts = await workoutAPI.getWorkouts({ 
  difficulty_level: 'beginner'
});

// Mark workout complete
await workoutAPI.markWorkoutComplete(workoutId, {
  completed: true,
  calories_burnt: 300
});
```

### Payments
```javascript
// Create payment intent
const intent = await paymentAPI.createPaymentIntent(planId);

// Confirm payment
await paymentAPI.confirmPayment(paymentIntentId, planId);
```

## Styling

Uses Tailwind CSS with custom configuration:
- Custom color scheme (red/indigo primary)
- Responsive breakpoints
- Utility-first approach
- Dark mode support (configured)

## Performance

- Code splitting with React Router
- Lazy loading components
- Optimized images
- Minified production build
- Caching strategies

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Environment Setup

For local development:

1. **Backend**: http://localhost:8000
2. **Frontend**: http://localhost:3000

The Vite proxy configuration automatically forwards `/api` requests to the backend.

## Troubleshooting

### CORS Issues
Ensure backend has CORS enabled for your frontend URL in `settings.py`.

### Authentication Issues
1. Check if tokens are stored in localStorage
2. Verify API endpoint configuration
3. Check token expiration

### Build Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy dist folder
```

### GitHub Pages
Configure `vite.config.js`:
```javascript
export default {
  base: '/fitnessapp/',
  // ...
}
```

### Docker
Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.
