from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
from datetime import timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed workouts, meal plans, exercises, and demo users'

    def handle(self, *args, **options):
        with transaction.atomic():
            self.seed_users()
            self.seed_categories()
            self.seed_workouts()
            self.seed_meal_plans()
        self.stdout.write(self.style.SUCCESS('All fitness data seeded successfully!'))

    def seed_users(self):
        from accounts.models import UserSubscription
        from subscriptions.models import SubscriptionPlan

        demo_users = [
            {'username': 'demo', 'email': 'demo@fitcoachpro.com', 'first_name': 'Demo', 'last_name': 'User', 'password': 'demo1234'},
            {'username': 'john_fit', 'email': 'john@example.com', 'first_name': 'John', 'last_name': 'Smith', 'password': 'demo1234'},
            {'username': 'jane_active', 'email': 'jane@example.com', 'first_name': 'Jane', 'last_name': 'Doe', 'password': 'demo1234'},
        ]
        for u in demo_users:
            if not User.objects.filter(username=u['username']).exists():
                user = User.objects.create_user(**u)
                plan = SubscriptionPlan.objects.filter(name='Pro').first()
                if plan:
                    UserSubscription.objects.get_or_create(
                        user=user,
                        defaults={
                            'subscription_plan': plan,
                            'status': 'active',
                            'end_date': timezone.now() + timedelta(days=30),
                        }
                    )
                self.stdout.write(f'  Created user: {u["username"]}')

    def seed_categories(self):
        from workouts.models import WorkoutCategory
        cats = [
            ('Cardio', '#ef4444', 'Heart-pumping cardio sessions'),
            ('Strength', '#f97316', 'Build muscle and raw strength'),
            ('HIIT', '#eab308', 'High-intensity interval training'),
            ('Yoga', '#22c55e', 'Flexibility, balance, and mindfulness'),
            ('Core', '#06b6d4', 'Abs, obliques, and lower back'),
            ('Upper Body', '#8b5cf6', 'Chest, back, shoulders, and arms'),
            ('Lower Body', '#ec4899', 'Legs, glutes, and calves'),
            ('Full Body', '#f97316', 'Total body conditioning'),
        ]
        for name, color, desc in cats:
            WorkoutCategory.objects.get_or_create(
                name=name,
                defaults={'color_code': color, 'description': desc, 'is_active': True}
            )
        self.stdout.write('  Categories seeded')

    def seed_workouts(self):
        from workouts.models import Workout, WorkoutCategory, Exercise
        from subscriptions.models import SubscriptionPlan

        admin = User.objects.filter(is_superuser=True).first() or User.objects.first()
        basic = SubscriptionPlan.objects.filter(name='Basic').first()
        pro = SubscriptionPlan.objects.filter(name='Pro').first()
        elite = SubscriptionPlan.objects.filter(name='Elite').first()

        cat = lambda name: WorkoutCategory.objects.filter(name=name).first()

        workouts_data = [
            {
                'title': '30-Minute Morning HIIT',
                'description': 'Kickstart your day with this energizing HIIT session. Burn fat, boost metabolism, and feel amazing — no equipment needed.',
                'category': cat('HIIT'),
                'difficulty_level': 'beginner',
                'duration_minutes': 30,
                'calories_burnt': 320,
                'equipment_needed': [],
                'muscle_groups': ['full body'],
                'is_featured': True,
                'rating': 4.8,
                'total_reviews': 124,
                'exercises': [
                    ('Jumping Jacks', 3, 30, None, 'Stand with feet together, jump while spreading arms and legs wide, then return.'),
                    ('High Knees', 3, 40, None, 'Run in place bringing knees up to hip height as fast as possible.'),
                    ('Burpees', 3, 10, None, 'From standing, drop to a push-up, do a push-up, jump feet forward, then jump up with arms overhead.'),
                    ('Mountain Climbers', 3, 30, None, 'In plank position, alternate driving knees toward chest rapidly.'),
                    ('Jump Squats', 3, 15, None, 'Squat down then explode upward, landing softly back into squat position.'),
                ],
            },
            {
                'title': 'Beginner Full Body Strength',
                'description': 'Perfect for beginners. Learn the fundamental movement patterns — squat, hinge, push, pull — with proper form.',
                'category': cat('Strength'),
                'difficulty_level': 'beginner',
                'duration_minutes': 45,
                'calories_burnt': 280,
                'equipment_needed': ['dumbbells'],
                'muscle_groups': ['chest', 'back', 'legs', 'shoulders'],
                'is_featured': True,
                'rating': 4.9,
                'total_reviews': 98,
                'exercises': [
                    ('Goblet Squat', 3, 12, None, 'Hold a dumbbell at chest height, squat deep keeping chest tall and knees tracking over toes.'),
                    ('Dumbbell Row', 3, 10, None, 'Hinge at hips, pull dumbbell to hip, squeezing shoulder blade at top.'),
                    ('Push-Up', 3, 10, None, 'Keep body straight, lower chest to floor, push back up. Modify on knees if needed.'),
                    ('Romanian Deadlift', 3, 12, None, 'Hinge at hips with soft knees, lower dumbbells along legs, feel hamstring stretch, drive hips forward to stand.'),
                    ('Overhead Press', 3, 10, None, 'Press dumbbells from shoulder height straight overhead, fully extending arms.'),
                ],
            },
            {
                'title': 'Advanced Power Lifting',
                'description': 'Heavy compound lifts for experienced athletes. Focus on progressive overload and maximal strength development.',
                'category': cat('Strength'),
                'difficulty_level': 'advanced',
                'duration_minutes': 75,
                'calories_burnt': 450,
                'equipment_needed': ['barbell', 'squat rack', 'bench'],
                'muscle_groups': ['chest', 'back', 'legs'],
                'is_featured': False,
                'rating': 4.7,
                'total_reviews': 56,
                'exercises': [
                    ('Barbell Back Squat', 5, 5, None, 'Bar on upper traps, squat to parallel or below, drive through heels to stand.'),
                    ('Bench Press', 5, 5, None, 'Lower bar to chest with control, press explosively, keep shoulder blades retracted.'),
                    ('Deadlift', 3, 5, None, 'Hinge to bar, brace core, drive floor away, lock out hips and knees simultaneously.'),
                    ('Barbell Row', 4, 6, None, 'Hinge to 45 degrees, pull bar to lower chest, control the descent.'),
                    ('Overhead Press', 4, 6, None, 'Press bar from front rack overhead, squeeze glutes and brace core throughout.'),
                ],
            },
            {
                'title': '20-Minute Core Crusher',
                'description': 'Intense core workout targeting abs, obliques, and lower back. Build a strong, stable midsection.',
                'category': cat('Core'),
                'difficulty_level': 'intermediate',
                'duration_minutes': 20,
                'calories_burnt': 180,
                'equipment_needed': ['mat'],
                'muscle_groups': ['abs', 'obliques', 'lower back'],
                'is_featured': True,
                'rating': 4.6,
                'total_reviews': 203,
                'exercises': [
                    ('Plank', 3, None, 45, 'Hold a straight body position on forearms and toes. Do not let hips sag.'),
                    ('Bicycle Crunches', 3, 20, None, 'Alternate bringing opposite elbow to knee while extending the other leg.'),
                    ('Leg Raises', 3, 15, None, 'Lying flat, raise straight legs to 90 degrees, lower slowly without touching floor.'),
                    ('Russian Twists', 3, 20, None, 'Seated with feet off floor, rotate torso side to side touching floor each rep.'),
                    ('Dead Bug', 3, 10, None, 'On back, extend opposite arm and leg while keeping lower back pressed to floor.'),
                ],
            },
            {
                'title': 'Yoga Flow for Flexibility',
                'description': 'A calming yoga flow to improve flexibility, reduce stress, and restore your body. Perfect for rest days.',
                'category': cat('Yoga'),
                'difficulty_level': 'beginner',
                'duration_minutes': 40,
                'calories_burnt': 150,
                'equipment_needed': ['yoga mat'],
                'muscle_groups': ['full body', 'hip flexors', 'hamstrings'],
                'is_featured': False,
                'rating': 4.9,
                'total_reviews': 312,
                'exercises': [
                    ('Sun Salutation', 3, None, 60, 'Flow through mountain pose, forward fold, plank, cobra, and downward dog.'),
                    ('Warrior I', 2, None, 45, 'Step one foot back, bend front knee, raise arms overhead, open chest.'),
                    ('Warrior II', 2, None, 45, 'From Warrior I, open hips to side, extend arms parallel to floor.'),
                    ('Pigeon Pose', 2, None, 60, 'Bring one shin forward parallel to mat, extend back leg, fold forward over front leg.'),
                    ('Child\'s Pose', 1, None, 60, 'Kneel, sit back on heels, extend arms forward, rest forehead on mat.'),
                ],
            },
            {
                'title': 'Upper Body Pump',
                'description': 'Sculpt your chest, back, shoulders, and arms with this targeted upper body session.',
                'category': cat('Upper Body'),
                'difficulty_level': 'intermediate',
                'duration_minutes': 50,
                'calories_burnt': 300,
                'equipment_needed': ['dumbbells', 'pull-up bar'],
                'muscle_groups': ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
                'is_featured': False,
                'rating': 4.7,
                'total_reviews': 87,
                'exercises': [
                    ('Pull-Ups', 4, 8, None, 'Hang from bar, pull chest to bar, lower with control. Use band for assistance if needed.'),
                    ('Dumbbell Chest Press', 4, 12, None, 'Lying on bench, press dumbbells from chest to full extension, lower slowly.'),
                    ('Lateral Raises', 3, 15, None, 'Raise dumbbells to shoulder height with slight bend in elbows, lower slowly.'),
                    ('Bicep Curls', 3, 12, None, 'Curl dumbbells from hips to shoulders, squeeze at top, lower with control.'),
                    ('Tricep Dips', 3, 12, None, 'On parallel bars or chair, lower body by bending elbows, press back up.'),
                ],
            },
            {
                'title': 'Leg Day Destroyer',
                'description': 'Build powerful legs and glutes with this comprehensive lower body workout. Walk funny tomorrow — worth it.',
                'category': cat('Lower Body'),
                'difficulty_level': 'intermediate',
                'duration_minutes': 55,
                'calories_burnt': 380,
                'equipment_needed': ['dumbbells', 'resistance bands'],
                'muscle_groups': ['quads', 'hamstrings', 'glutes', 'calves'],
                'is_featured': True,
                'rating': 4.8,
                'total_reviews': 145,
                'exercises': [
                    ('Barbell Squat', 4, 10, None, 'Full depth squat with controlled descent and explosive ascent.'),
                    ('Romanian Deadlift', 4, 10, None, 'Hinge at hips, feel hamstring stretch, drive hips forward to stand.'),
                    ('Walking Lunges', 3, 12, None, 'Step forward into lunge, alternate legs, keep torso upright.'),
                    ('Glute Bridge', 3, 15, None, 'Lying on back, drive hips to ceiling squeezing glutes at top.'),
                    ('Calf Raises', 4, 20, None, 'Rise onto toes, hold briefly at top, lower slowly.'),
                ],
            },
            {
                'title': '45-Minute Cardio Blast',
                'description': 'Steady-state and interval cardio to maximize fat burning and cardiovascular endurance.',
                'category': cat('Cardio'),
                'difficulty_level': 'intermediate',
                'duration_minutes': 45,
                'calories_burnt': 420,
                'equipment_needed': [],
                'muscle_groups': ['full body', 'cardiovascular'],
                'is_featured': False,
                'rating': 4.5,
                'total_reviews': 76,
                'exercises': [
                    ('Warm-Up Jog', 1, None, 300, 'Light jog to raise heart rate and warm up joints.'),
                    ('Sprint Intervals', 8, None, 30, 'Sprint at 90% effort for 30 seconds, rest 30 seconds. Repeat 8 times.'),
                    ('Jump Rope', 3, None, 60, 'Jump rope at moderate pace, focus on rhythm and light landings.'),
                    ('Box Jumps', 3, 10, None, 'Jump onto box or step, land softly, step down, repeat.'),
                    ('Cool-Down Walk', 1, None, 300, 'Walk at easy pace to bring heart rate down gradually.'),
                ],
            },
            {
                'title': 'Bodyweight Full Body Circuit',
                'description': 'Zero equipment needed. This circuit builds strength and endurance using only your bodyweight — do it anywhere.',
                'category': cat('Full Body'),
                'difficulty_level': 'beginner',
                'duration_minutes': 35,
                'calories_burnt': 260,
                'equipment_needed': [],
                'muscle_groups': ['full body'],
                'is_featured': False,
                'rating': 4.6,
                'total_reviews': 189,
                'exercises': [
                    ('Push-Ups', 3, 15, None, 'Standard push-up. Modify on knees if needed.'),
                    ('Air Squats', 3, 20, None, 'Bodyweight squat, arms forward for balance, squat to parallel.'),
                    ('Reverse Lunges', 3, 12, None, 'Step backward into lunge, alternate legs.'),
                    ('Tricep Push-Ups', 3, 10, None, 'Push-up with elbows close to body, targeting triceps.'),
                    ('Glute Bridges', 3, 20, None, 'Lying on back, drive hips up, squeeze glutes at top.'),
                ],
            },
            {
                'title': 'Elite Athlete Conditioning',
                'description': 'Sport-specific conditioning for serious athletes. Combines strength, power, agility, and endurance.',
                'category': cat('HIIT'),
                'difficulty_level': 'advanced',
                'duration_minutes': 60,
                'calories_burnt': 550,
                'equipment_needed': ['barbell', 'kettlebell', 'box'],
                'muscle_groups': ['full body'],
                'is_featured': False,
                'rating': 4.9,
                'total_reviews': 43,
                'exercises': [
                    ('Power Clean', 5, 3, None, 'Explosive pull from floor to front rack position. Focus on hip drive.'),
                    ('Box Jumps', 5, 5, None, 'Maximum height box jumps with full hip extension at top.'),
                    ('Kettlebell Swings', 4, 20, None, 'Hip hinge power movement, swing bell to shoulder height.'),
                    ('Sled Push', 4, None, 30, 'Push weighted sled 20 meters at maximum effort.'),
                    ('Battle Ropes', 4, None, 30, 'Alternate arm waves with battle ropes at maximum intensity.'),
                ],
            },
        ]

        for w in workouts_data:
            exercises = w.pop('exercises')
            workout, created = Workout.objects.get_or_create(
                title=w['title'],
                defaults={**w, 'instructions': w['description'], 'created_by': admin, 'is_active': True}
            )
            if created:
                for i, (name, sets, reps, duration, instructions) in enumerate(exercises):
                    Exercise.objects.create(
                        workout=workout,
                        name=name,
                        description=instructions,
                        sets=sets,
                        reps=reps,
                        duration_seconds=duration,
                        rest_seconds=60,
                        instructions=instructions,
                        order=i + 1,
                    )
        self.stdout.write(f'  Seeded {len(workouts_data)} workouts')

    def seed_meal_plans(self):
        from workouts.models import MealPlan, Meal

        admin = User.objects.filter(is_superuser=True).first() or User.objects.first()

        plans = [
            {
                'title': 'High Protein Muscle Builder',
                'description': 'Designed for muscle gain. High protein, moderate carbs, and healthy fats to fuel workouts and recovery.',
                'difficulty_level': 'intermediate',
                'calories_per_day': 2800,
                'protein_grams': 210,
                'carbs_grams': 280,
                'fats_grams': 80,
                'duration_days': 7,
                'dietary_type': 'regular',
                'meals_per_day': 5,
                'meals': [
                    (1, 'breakfast', 'Protein Oatmeal Bowl', 'Oats with protein powder, banana, and almond butter', ['1 cup oats', '1 scoop protein powder', '1 banana', '2 tbsp almond butter', '1 cup milk'], 'Cook oats, stir in protein powder, top with sliced banana and almond butter.', 520, 45, 55, 14, 10),
                    (1, 'lunch', 'Grilled Chicken Rice Bowl', 'Lean chicken breast with brown rice and roasted vegetables', ['200g chicken breast', '1 cup brown rice', 'Mixed vegetables', 'Olive oil', 'Garlic', 'Herbs'], 'Season and grill chicken. Cook rice. Roast vegetables with olive oil. Combine in bowl.', 620, 55, 65, 12, 20),
                    (1, 'snack', 'Greek Yogurt & Berries', 'High protein snack with antioxidants', ['200g Greek yogurt', '1 cup mixed berries', '1 tbsp honey', '2 tbsp granola'], 'Layer yogurt, berries, drizzle honey, top with granola.', 280, 22, 35, 6, 10),
                    (1, 'dinner', 'Salmon with Sweet Potato', 'Omega-3 rich salmon with complex carbs', ['200g salmon fillet', '1 large sweet potato', 'Asparagus', 'Lemon', 'Olive oil'], 'Bake salmon at 400F for 15 min. Roast sweet potato and asparagus. Serve with lemon.', 580, 45, 52, 18, 25),
                    (1, 'snack', 'Cottage Cheese & Nuts', 'Slow-digesting protein before bed', ['200g cottage cheese', '30g mixed nuts', '1 tsp honey'], 'Combine cottage cheese with nuts and drizzle honey.', 320, 28, 18, 16, 15),
                ],
            },
            {
                'title': 'Keto Fat Loss Plan',
                'description': 'Low carb, high fat ketogenic plan to shift your body into fat-burning mode. Effective for rapid fat loss.',
                'difficulty_level': 'intermediate',
                'calories_per_day': 1800,
                'protein_grams': 140,
                'carbs_grams': 30,
                'fats_grams': 130,
                'duration_days': 7,
                'dietary_type': 'keto',
                'meals_per_day': 3,
                'meals': [
                    (1, 'breakfast', 'Keto Egg & Avocado Plate', 'Scrambled eggs with avocado and bacon', ['3 eggs', '1 avocado', '3 strips bacon', 'Spinach', 'Olive oil', 'Salt & pepper'], 'Scramble eggs in olive oil. Cook bacon until crispy. Slice avocado. Serve with spinach.', 520, 28, 6, 44, 10),
                    (1, 'lunch', 'Bunless Burger Bowl', 'Beef patty over greens with cheese and avocado', ['200g beef patty', 'Mixed greens', '1 avocado', '2 slices cheddar', 'Tomato', 'Mustard'], 'Cook beef patty. Assemble over greens with toppings.', 620, 42, 8, 48, 20),
                    (1, 'dinner', 'Baked Salmon with Broccoli', 'Fatty fish with low-carb vegetables', ['200g salmon', '2 cups broccoli', 'Butter', 'Garlic', 'Lemon', 'Herbs'], 'Bake salmon with butter and garlic. Steam broccoli. Serve with lemon.', 480, 42, 12, 30, 25),
                ],
            },
            {
                'title': 'Vegan Athlete Plan',
                'description': 'Complete plant-based nutrition for athletes. Proves you can build muscle and perform at your best on plants.',
                'difficulty_level': 'beginner',
                'calories_per_day': 2400,
                'protein_grams': 130,
                'carbs_grams': 320,
                'fats_grams': 65,
                'duration_days': 7,
                'dietary_type': 'vegan',
                'meals_per_day': 4,
                'meals': [
                    (1, 'breakfast', 'Tofu Scramble', 'Protein-packed tofu scramble with vegetables', ['300g firm tofu', 'Bell peppers', 'Spinach', 'Turmeric', 'Nutritional yeast', 'Olive oil'], 'Crumble tofu, cook with vegetables and spices until golden.', 380, 28, 22, 18, 15),
                    (1, 'lunch', 'Lentil & Quinoa Bowl', 'Complete protein bowl with lentils and quinoa', ['1 cup lentils', '1 cup quinoa', 'Roasted vegetables', 'Tahini dressing', 'Lemon'], 'Cook lentils and quinoa. Roast vegetables. Make tahini dressing. Assemble bowl.', 580, 32, 82, 12, 25),
                    (1, 'snack', 'Smoothie Bowl', 'Nutrient-dense smoothie bowl with toppings', ['1 cup frozen berries', '1 banana', 'Plant protein powder', 'Almond milk', 'Granola', 'Seeds'], 'Blend frozen fruit with protein and milk. Pour in bowl, add toppings.', 420, 24, 68, 8, 10),
                    (1, 'dinner', 'Chickpea Curry', 'Hearty chickpea curry with brown rice', ['400g chickpeas', '1 cup brown rice', 'Coconut milk', 'Tomatoes', 'Curry spices', 'Spinach'], 'Sauté spices, add tomatoes and coconut milk, add chickpeas, simmer 20 min. Serve over rice.', 620, 24, 98, 14, 30),
                ],
            },
            {
                'title': 'Weight Loss 1500 Cal Plan',
                'description': 'Calorie-controlled plan for sustainable weight loss. Balanced macros, high volume, and satisfying meals.',
                'difficulty_level': 'beginner',
                'calories_per_day': 1500,
                'protein_grams': 120,
                'carbs_grams': 150,
                'fats_grams': 45,
                'duration_days': 7,
                'dietary_type': 'regular',
                'meals_per_day': 4,
                'meals': [
                    (1, 'breakfast', 'Egg White Omelette', 'Light, high-protein breakfast to start the day', ['4 egg whites', '1 whole egg', 'Spinach', 'Mushrooms', 'Feta cheese', 'Herbs'], 'Whisk eggs, cook in non-stick pan, fill with vegetables and feta, fold.', 280, 28, 8, 12, 10),
                    (1, 'lunch', 'Turkey Lettuce Wraps', 'Low-carb wraps packed with lean protein', ['200g ground turkey', 'Butter lettuce leaves', 'Cucumber', 'Carrots', 'Soy sauce', 'Ginger'], 'Cook turkey with soy sauce and ginger. Serve in lettuce cups with vegetables.', 320, 35, 12, 14, 20),
                    (1, 'snack', 'Apple & Almond Butter', 'Balanced snack with fiber and healthy fat', ['1 large apple', '2 tbsp almond butter'], 'Slice apple, serve with almond butter for dipping.', 220, 5, 28, 12, 5),
                    (1, 'dinner', 'Baked Cod with Vegetables', 'Light, lean dinner with plenty of vegetables', ['200g cod fillet', 'Zucchini', 'Cherry tomatoes', 'Olive oil', 'Herbs', 'Lemon'], 'Bake cod with vegetables at 400F for 20 min. Season with herbs and lemon.', 380, 38, 22, 14, 25),
                ],
            },
            {
                'title': 'Mediterranean Lifestyle Plan',
                'description': 'Heart-healthy Mediterranean diet. Olive oil, fish, vegetables, and whole grains for longevity and vitality.',
                'difficulty_level': 'beginner',
                'calories_per_day': 2000,
                'protein_grams': 100,
                'carbs_grams': 240,
                'fats_grams': 75,
                'duration_days': 7,
                'dietary_type': 'regular',
                'meals_per_day': 3,
                'meals': [
                    (1, 'breakfast', 'Greek Yogurt Parfait', 'Classic Mediterranean breakfast with yogurt and honey', ['200g Greek yogurt', 'Mixed berries', '2 tbsp honey', '3 tbsp granola', 'Walnuts'], 'Layer yogurt, berries, granola, drizzle honey, top with walnuts.', 420, 18, 58, 14, 10),
                    (1, 'lunch', 'Greek Salad with Grilled Chicken', 'Fresh Mediterranean salad with lean protein', ['150g grilled chicken', 'Cucumber', 'Tomatoes', 'Olives', 'Feta', 'Olive oil', 'Oregano'], 'Grill chicken. Chop vegetables. Combine with olives and feta. Dress with olive oil and oregano.', 480, 38, 18, 28, 20),
                    (1, 'dinner', 'Baked Sea Bass with Quinoa', 'Elegant Mediterranean dinner', ['200g sea bass', '1 cup quinoa', 'Cherry tomatoes', 'Capers', 'Olive oil', 'Lemon', 'Herbs'], 'Bake sea bass with tomatoes and capers. Cook quinoa. Serve with lemon and herbs.', 560, 42, 52, 18, 30),
                ],
            },
        ]

        for p in plans:
            meals = p.pop('meals')
            plan, created = MealPlan.objects.get_or_create(
                title=p['title'],
                defaults={**p, 'created_by': admin, 'is_active': True}
            )
            if created:
                for (day, meal_type, name, desc, ingredients, recipe, cal, prot, carbs, fats, prep) in meals:
                    Meal.objects.create(
                        meal_plan=plan,
                        day=day,
                        meal_type=meal_type,
                        name=name,
                        description=desc,
                        ingredients=ingredients,
                        recipe=recipe,
                        calories=cal,
                        protein=prot,
                        carbs=carbs,
                        fats=fats,
                        preparation_time_minutes=prep,
                    )
        self.stdout.write(f'  Seeded {len(plans)} meal plans')
