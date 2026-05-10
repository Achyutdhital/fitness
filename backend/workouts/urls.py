from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    WorkoutViewSet, WorkoutCategoryViewSet, MealPlanViewSet, 
    UserWorkoutProgressViewSet, WorkoutProgramViewSet, WorkoutPhaseViewSet
)

router = DefaultRouter()
router.register(r'workouts', WorkoutViewSet, basename='workout')
router.register(r'categories', WorkoutCategoryViewSet, basename='category')
router.register(r'meal-plans', MealPlanViewSet, basename='meal-plan')
router.register(r'progress', UserWorkoutProgressViewSet, basename='progress')
router.register(r'programs', WorkoutProgramViewSet, basename='program')
router.register(r'phases', WorkoutPhaseViewSet, basename='phase')

urlpatterns = router.urls
