from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.text import slugify
from django.db import transaction

from cms.models import (
    WebsiteSettings, BlogCategory, BlogPost, DynamicPage,
    SocialMediaLinks, NewsletterSubscription,
    PageSection, SectionItem, ImageAsset,
)
from subscriptions.models import SubscriptionTier, SubscriptionPlan


class Command(BaseCommand):
    help = "Populate the database with demo content, homepage sections, images, and sample plans"

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete existing demo data before seeding',
        )

    def handle(self, *args, **options):
        clear = options['clear']

        with transaction.atomic():
            if clear:
                self.clear_demo_data()

            settings = self.seed_website_settings()
            self.seed_social_links()
            self.seed_dynamic_pages()
            self.seed_blog()
            self.seed_newsletter_examples()
            self.seed_subscription_plans()
            self.seed_assets()
            self.seed_home_sections(settings)
            self.seed_about_sections()
            self.seed_services_sections()

        self.stdout.write(self.style.SUCCESS('Demo data populated successfully.'))

    def clear_demo_data(self):
        SectionItem.objects.all().delete()
        PageSection.objects.all().delete()
        ImageAsset.objects.all().delete()
        BlogPost.objects.all().delete()
        BlogCategory.objects.all().delete()
        DynamicPage.objects.all().delete()
        SocialMediaLinks.objects.all().delete()
        NewsletterSubscription.objects.all().delete()
        SubscriptionPlan.objects.all().delete()
        SubscriptionTier.objects.all().delete()
        WebsiteSettings.objects.all().delete()

    def seed_website_settings(self):
        defaults = {
            'site_name': 'FitnessPro',
            'site_tagline': 'Transform Your Body, Transform Your Life',
            'site_description': 'A premium fitness subscription platform with workouts, meal plans, coaching, and progress tracking.',
            'email': 'hello@fitnesspro.com',
            'phone': '+1 (555) 014-2026',
            'address': '123 Wellness Avenue, New York, NY',
            'logo_url': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=256&q=80',
            'favicon_url': 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=64&q=80',
            'hero_image_url': 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1600&q=80',
            'facebook_url': 'https://facebook.com/fitnesspro',
            'twitter_url': 'https://x.com/fitnesspro',
            'instagram_url': 'https://instagram.com/fitnesspro',
            'linkedin_url': 'https://linkedin.com/company/fitnesspro',
            'youtube_url': 'https://youtube.com/@fitnesspro',
            'meta_keywords': 'fitness, workouts, nutrition, subscription, coaching',
            'meta_description': 'FitnessPro is a dynamic fitness subscription platform for workouts, meal plans, and coaching.',
            'timezone': 'UTC',
            'currency': 'USD',
            'language': 'en',
            'maintenance_mode': False,
            'maintenance_message': '',
        }

        settings = WebsiteSettings.objects.first()
        if settings:
            for key, value in defaults.items():
                setattr(settings, key, value)
            settings.save()
        else:
            settings = WebsiteSettings.objects.create(**defaults)
        return settings

    def seed_social_links(self):
        links = [
            ('facebook', 'https://facebook.com/fitnesspro', 'fab fa-facebook-f', 1),
            ('instagram', 'https://instagram.com/fitnesspro', 'fab fa-instagram', 2),
            ('twitter', 'https://x.com/fitnesspro', 'fab fa-x-twitter', 3),
            ('linkedin', 'https://linkedin.com/company/fitnesspro', 'fab fa-linkedin-in', 4),
            ('youtube', 'https://youtube.com/@fitnesspro', 'fab fa-youtube', 5),
        ]
        for platform, url, icon_class, order in links:
            SocialMediaLinks.objects.update_or_create(
                platform=platform,
                defaults={
                    'url': url,
                    'icon_class': icon_class,
                    'display_order': order,
                }
            )

    def seed_dynamic_pages(self):
        pages = [
            ('About Us', 'about-us', 'Learn more about our mission, trainers, and approach to fitness.', True, True, False),
            ('Privacy Policy', 'privacy-policy', 'How we handle your data and protect your privacy.', True, False, True),
            ('Terms of Service', 'terms-of-service', 'Rules and terms for using the FitnessPro platform.', True, False, True),
            ('Contact', 'contact', 'Get in touch with our support team and fitness experts.', True, False, False),
        ]
        for title, slug, content, visible, footer, menu in pages:
            DynamicPage.objects.update_or_create(
                slug=slug,
                defaults={
                    'title': title,
                    'content': content,
                    'is_visible': visible,
                    'show_in_footer': footer,
                    'show_in_menu': menu,
                    'meta_description': content,
                    'meta_keywords': f'{title.lower()}, fitness, health',
                }
            )

    def seed_blog(self):
        categories = [
            ('Training Tips', 'training-tips', 'Workout guides, lifting advice, and training strategies.', '#ef4444'),
            ('Nutrition', 'nutrition', 'Meal prep, macros, and healthy eating advice.', '#22c55e'),
            ('Mindset', 'mindset', 'Motivation, discipline, and fitness psychology.', '#8b5cf6'),
        ]
        cat_objects = {}
        for name, slug, description, color in categories:
            cat_objects[name] = BlogCategory.objects.update_or_create(
                slug=slug,
                defaults={
                    'name': name,
                    'description': description,
                    'color': color,
                }
            )[0]

        posts = [
            {
                'title': '5 Beginner Workout Mistakes to Avoid',
                'category': cat_objects['Training Tips'],
                'content': 'Start strong by avoiding common form, recovery, and overtraining mistakes. Build consistency first, then intensity.',
                'excerpt': 'Learn the common mistakes beginners make and how to fix them quickly.',
                'featured_image_url': 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
                'author': 'Coach Maya',
                'status': 'published',
                'featured': True,
                'published_date': timezone.now(),
                'tags': 'beginner,workout,training',
            },
            {
                'title': 'Meal Prep Made Simple for Busy People',
                'category': cat_objects['Nutrition'],
                'content': 'A practical meal prep system helps you stay on track even on your busiest weeks. Keep proteins, carbs, and vegetables ready.',
                'excerpt': 'A simple meal prep workflow for real life.',
                'featured_image_url': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80',
                'author': 'Nina Patel',
                'status': 'published',
                'featured': True,
                'published_date': timezone.now(),
                'tags': 'nutrition,meal-prep,healthy-eating',
            },
            {
                'title': 'How to Stay Consistent When Motivation Fades',
                'category': cat_objects['Mindset'],
                'content': 'Motivation comes and goes. Systems, habits, and accountability keep you moving forward when motivation is low.',
                'excerpt': 'Use habits and structure instead of waiting for motivation.',
                'featured_image_url': 'https://images.unsplash.com/photo-1526401485004-2fda9f3f2d36?auto=format&fit=crop&w=1200&q=80',
                'author': 'Alex Carter',
                'status': 'published',
                'featured': False,
                'published_date': timezone.now(),
                'tags': 'mindset,consistency,motivation',
            },
        ]

        for post in posts:
            defaults = post.copy()
            title = defaults.pop('title')
            BlogPost.objects.update_or_create(
                slug=slugify(title),
                defaults={
                    'title': title,
                    **defaults,
                    'meta_description': defaults['excerpt'],
                    'meta_keywords': defaults['tags'],
                }
            )

    def seed_newsletter_examples(self):
        NewsletterSubscription.objects.get_or_create(
            email='subscriber@example.com',
            defaults={
                'name': 'Demo Subscriber',
                'is_active': True,
            }
        )

    def seed_subscription_plans(self):
        tiers = [
            {
                'name': 'free',
                'description': 'For the curious beginner. Dashboard & tracking always yours. Preview Day 1 of a beginner program — but progression, full programs, and real structure require a subscription.',
                'features': [
                    '✅ Dashboard & progress tracking (always free)',
                    '✅ Streak tracking & basic achievements',
                    '✅ Day 1 sample of 1 beginner workout (permanent)',
                    '✅ Earn 25 pts per ad — preview 1 session at 50 pts',
                    '❌ No full programs or multi-week progressions',
                    '❌ No meal plans',
                    '❌ No progress analytics',
                    '❌ No community or challenges',
                ],
                'sessions_per_week': 0,
                'priority': 0,
                'plans': []
            },
            {
                'name': 'basic',
                'description': 'For the self-motivated trainer who wants real structure. Full multi-week programs, complete meal plans, and progress analytics — no coach, no personalization, but everything you need to train independently.',
                'features': [
                    '✅ Everything in Free',
                    '✅ Full multi-week workout programs (all weeks & days)',
                    '✅ Exercise progressions, load increases & alternatives',
                    '✅ Complete meal plan library with macro tracking',
                    '✅ Detailed progress analytics & charts',
                    '✅ Community access, challenges & leaderboard',
                    '✅ No ads — ever',
                    '❌ Generic programs (not built for your body or goals)',
                    '❌ No coach feedback or form checks',
                    '❌ No plan adjustments when you plateau',
                ],
                'sessions_per_week': 0,
                'priority': 1,
                'plans': [
                    {'cycle': 'monthly', 'price': '9.99', 'days': 30},
                    {'cycle': 'quarterly', 'price': '24.99', 'days': 90},
                    {'cycle': 'yearly', 'price': '79.99', 'days': 365},
                ]
            },
            {
                'name': 'pro',
                'description': 'For the results-focused member ready for real coaching. Your coach builds a plan specifically for your body, goals, and limitations. 1 live session per week, form reviews, and bi-weekly plan adjustments.',
                'features': [
                    '✅ Everything in Basic',
                    '✅ Coach-built custom workout plan (your goals, body, limits)',
                    '✅ Coach-built custom meal & diet plan (your dietary needs)',
                    '✅ 1 live video coaching session per week (30 min)',
                    '✅ Form check: submit video → coach review within 48h',
                    '✅ Plan adjusted every 2 weeks based on your progress',
                    '✅ Coach messaging — replies within 24h (weekdays)',
                    '❌ Shared coach (coach works with multiple clients)',
                    '❌ Only 1 session/week — no mid-week support',
                    '❌ No same-day responses or emergency adjustments',
                ],
                'sessions_per_week': 1,
                'priority': 2,
                'plans': [
                    {'cycle': 'monthly', 'price': '29.99', 'days': 30},
                    {'cycle': 'quarterly', 'price': '79.99', 'days': 90},
                    {'cycle': 'yearly', 'price': '249.99', 'days': 365},
                ]
            },
            {
                'name': 'elite',
                'description': 'For the transformation-committed client. A dedicated coach who knows your name, your schedule, and your body. 3 sessions per week, daily messaging, rapid adjustments, and full accountability.',
                'features': [
                    '✅ Everything in Pro',
                    '✅ DEDICATED personal coach (assigned, fewer clients)',
                    '✅ 3 live coaching sessions per week (45 min each)',
                    '✅ Daily form check & feedback (submit anytime)',
                    '✅ Direct daily messaging — coach replies within 2h, 7 days',
                    '✅ Emergency plan adjustment within 24h anytime',
                    '✅ Full nutrition, recovery & sleep optimization',
                    '✅ Monthly body composition review & goal reset',
                    '✅ Priority access to new programs & features first',
                ],
                'sessions_per_week': 3,
                'priority': 3,
                'plans': [
                    {'cycle': 'monthly', 'price': '99.99', 'days': 30},
                    {'cycle': 'quarterly', 'price': '269.99', 'days': 90},
                    {'cycle': 'yearly', 'price': '899.99', 'days': 365},
                ]
            },
        ]

        for t_data in tiers:
            tier, _ = SubscriptionTier.objects.update_or_create(
                name=t_data['name'],
                defaults={
                    'description': t_data['description'],
                    'features': t_data['features'],
                    'sessions_per_week': t_data['sessions_per_week'],
                    'priority': t_data['priority'],
                }
            )

            for p_data in t_data['plans']:
                SubscriptionPlan.objects.update_or_create(
                    tier=tier,
                    billing_cycle=p_data['cycle'],
                    defaults={
                        'name': f"{tier.get_name_display()} {p_data['cycle'].capitalize()}",
                        'price': p_data['price'],
                        'duration_days': p_data['days'],
                        'priority': tier.priority,
                    }
                )



    def seed_assets(self):

        assets = [
            ('Hero Background', 'Main hero image for homepage', 'hero', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=80', 'Fitness trainer in a gym', 1600, 900),
            ('Feature Workouts', 'Workout icon image', 'icon', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80', 'Kettlebell workout', 800, 600),
            ('Feature Nutrition', 'Healthy food image', 'gallery', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80', 'Healthy meal prep', 800, 600),
            ('Coach Portrait', 'Trainer portrait', 'team', 'https://images.unsplash.com/photo-1526401485004-2fda9f3f2d36?auto=format&fit=crop&w=800&q=80', 'Fitness coach portrait', 800, 800),
            ('Testimonial Photo', 'Happy customer portrait', 'testimonial', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80', 'Customer smiling', 800, 800),
            ('Gallery Workout 1', 'Gym action shot', 'gallery', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80', 'Strength training', 1200, 800),
            ('Gallery Workout 2', 'Cardio session', 'gallery', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80', 'Cardio workout', 1200, 800),
            ('Logo', 'Brand logo image', 'logo', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=256&q=80', 'FitnessPro logo', 256, 256),
        ]

        for name, description, category, url, alt_text, width, height in assets:
            ImageAsset.objects.update_or_create(
                name=name,
                defaults={
                    'description': description,
                    'category': category,
                    'image_url': url,
                    'alt_text': alt_text,
                    'width': width,
                    'height': height,
                    'file_size': None,
                }
            )

    def seed_home_sections(self, settings):
        hero_image = ImageAsset.objects.filter(category='hero').first()
        logo = ImageAsset.objects.filter(category='logo').first()

        hero = PageSection.objects.update_or_create(
            page='home',
            section_type='hero',
            defaults={
                'title': 'Transform Your Body, Transform Your Life',
                'subtitle': 'Fitness coaching, meal plans, and progress tracking in one place',
                'description': 'Join thousands of members using FitnessPro to build strength, consistency, and confidence.',
                'image_url': hero_image.image_url if hero_image else settings.hero_image_url,
                'background_color': '#111827',
                'text_color': '#FFFFFF',
                'columns': 2,
                'is_visible': True,
                'display_order': 1,
                'cta_text': 'Start Free Trial',
                'cta_url': '/register',
                'cta_style': 'primary',
            }
        )[0]

        features = PageSection.objects.update_or_create(
            page='home',
            section_type='features',
            defaults={
                'title': 'Why Choose FitnessPro?',
                'description': 'A complete fitness experience designed for real results.',
                'background_color': '#FFFFFF',
                'text_color': '#111827',
                'columns': 3,
                'is_visible': True,
                'display_order': 2,
            }
        )[0]

        pricing = PageSection.objects.update_or_create(
            page='home',
            section_type='pricing',
            defaults={
                'title': 'Simple, Transparent Pricing',
                'description': 'Choose the plan that fits your goals and budget.',
                'background_color': '#F9FAFB',
                'text_color': '#111827',
                'columns': 3,
                'is_visible': True,
                'display_order': 3,
            }
        )[0]

        testimonials = PageSection.objects.update_or_create(
            page='home',
            section_type='testimonials',
            defaults={
                'title': 'Loved by Members',
                'description': 'Real people. Real results.',
                'background_color': '#FFFFFF',
                'text_color': '#111827',
                'columns': 3,
                'is_visible': True,
                'display_order': 4,
            }
        )[0]

        cta = PageSection.objects.update_or_create(
            page='home',
            section_type='cta',
            defaults={
                'title': 'Ready to Start Your Fitness Journey?',
                'description': 'Sign up today and begin your transformation.',
                'background_color': '#EF4444',
                'text_color': '#FFFFFF',
                'columns': 1,
                'is_visible': True,
                'display_order': 5,
                'cta_text': 'Get Started',
                'cta_url': '/register',
                'cta_style': 'primary',
            }
        )[0]

        banner = PageSection.objects.update_or_create(
            page='home',
            section_type='banner',
            defaults={
                'title': 'New members get 7 days free',
                'description': 'Try FitnessPro risk-free and cancel anytime.',
                'background_color': '#1D4ED8',
                'text_color': '#FFFFFF',
                'columns': 1,
                'is_visible': True,
                'display_order': 6,
                'cta_text': 'Claim Trial',
                'cta_url': '/register',
                'cta_style': 'secondary',
            }
        )[0]

        self.seed_section_items(features, [
            {
                'title': 'Expert Workouts',
                'description': 'Personalized workout routines built by certified trainers.',
                'icon': '🏋️',
                'image_url': 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
                'display_order': 1,
            },
            {
                'title': 'Meal Plans',
                'description': 'Nutrition plans aligned with your fitness goals and schedule.',
                'icon': '🥗',
                'image_url': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80',
                'display_order': 2,
            },
            {
                'title': 'Progress Tracking',
                'description': 'Track weight, workouts, and milestones in one dashboard.',
                'icon': '📊',
                'image_url': 'https://images.unsplash.com/photo-1554284126-aa88f22d8b74?auto=format&fit=crop&w=800&q=80',
                'display_order': 3,
            },
            {
                'title': 'Community',
                'description': 'Stay motivated with a supportive fitness community.',
                'icon': '👥',
                'image_url': 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
                'display_order': 4,
            },
            {
                'title': 'Goal Setting',
                'description': 'Set weekly, monthly, and long-term goals that actually stick.',
                'icon': '🎯',
                'image_url': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',
                'display_order': 5,
            },
            {
                'title': 'Mobile Friendly',
                'description': 'Access workouts and plans on any device, anywhere.',
                'icon': '📱',
                'image_url': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
                'display_order': 6,
            },
        ])

        self.seed_section_items(pricing, [
            {
                'title': 'Basic',
                'description': 'Best for beginners',
                'price': '9.99',
                'price_period': 'month',
                'features': '5 workouts/week\nCommunity access\nProgress tracking',
                'button_text': 'Get Started',
                'button_url': '/register',
                'display_order': 1,
            },
            {
                'title': 'Pro',
                'description': 'Most popular plan',
                'price': '19.99',
                'price_period': 'month',
                'features': 'Unlimited workouts\nMeal plans\nPriority support\nCommunity access',
                'button_text': 'Get Started',
                'button_url': '/register',
                'display_order': 2,
                'is_highlighted': True,
            },
            {
                'title': 'Elite',
                'description': 'Full coaching experience',
                'price': '29.99',
                'price_period': 'month',
                'features': 'Everything in Pro\n1-on-1 coaching\nNutrition consultation\nCustom programs',
                'button_text': 'Get Started',
                'button_url': '/register',
                'display_order': 3,
            },
        ])

        self.seed_section_items(testimonials, [
            {
                'title': 'Sarah M.',
                'description': 'I finally stayed consistent and lost 18 lbs in 4 months.',
                'image_url': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
                'display_order': 1,
                'metadata': '{"role": "Busy Professional"}',
            },
            {
                'title': 'James K.',
                'description': 'The meal plans made healthy eating effortless.',
                'image_url': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
                'display_order': 2,
                'metadata': '{"role": "Software Engineer"}',
            },
            {
                'title': 'Priya D.',
                'description': 'The app keeps me accountable every single week.',
                'image_url': 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=800&q=80',
                'display_order': 3,
                'metadata': '{"role": "Student"}',
            },
        ])

    def seed_about_sections(self):
        about = PageSection.objects.update_or_create(
            page='about',
            section_type='text',
            defaults={
                'title': 'About FitnessPro',
                'description': 'We build simple fitness systems that help people stay consistent. Our platform combines workouts, nutrition, and coaching into one dynamic experience.',
                'background_color': '#FFFFFF',
                'text_color': '#111827',
                'columns': 1,
                'is_visible': True,
                'display_order': 1,
            }
        )[0]

        PageSection.objects.update_or_create(
            page='about',
            section_type='team',
            defaults={
                'title': 'Meet the Team',
                'description': 'Certified coaches and nutrition experts.',
                'background_color': '#F9FAFB',
                'text_color': '#111827',
                'columns': 3,
                'is_visible': True,
                'display_order': 2,
            }
        )

        team_section = PageSection.objects.get(page='about', section_type='team')
        self.seed_section_items(team_section, [
            {
                'title': 'Maya Johnson',
                'description': 'Strength coach with 10 years of experience.',
                'image_url': 'https://images.unsplash.com/photo-1494385345383-e9534f2b4f8f?auto=format&fit=crop&w=800&q=80',
                'display_order': 1,
                'metadata': '{"role": "Head Coach"}',
            },
            {
                'title': 'Nina Patel',
                'description': 'Certified nutritionist focused on sustainable habits.',
                'image_url': 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?auto=format&fit=crop&w=800&q=80',
                'display_order': 2,
                'metadata': '{"role": "Nutritionist"}',
            },
            {
                'title': 'Alex Carter',
                'description': 'Performance coach and mobility specialist.',
                'image_url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
                'display_order': 3,
                'metadata': '{"role": "Performance Coach"}',
            },
        ])

    def seed_services_sections(self):
        services = PageSection.objects.update_or_create(
            page='services',
            section_type='features',
            defaults={
                'title': 'Services Included',
                'description': 'Everything you need in one subscription.',
                'background_color': '#FFFFFF',
                'text_color': '#111827',
                'columns': 3,
                'is_visible': True,
                'display_order': 1,
            }
        )[0]

        self.seed_section_items(services, [
            {
                'title': 'Workout Library',
                'description': 'Follow guided workouts for strength, cardio, and mobility.',
                'icon': '💪',
                'display_order': 1,
            },
            {
                'title': 'Nutrition Plans',
                'description': 'Get meal plans based on your goals and preferences.',
                'icon': '🥦',
                'display_order': 2,
            },
            {
                'title': 'Accountability Coaching',
                'description': 'Stay on track with regular check-ins and progress reviews.',
                'icon': '📞',
                'display_order': 3,
            },
        ])

    def seed_section_items(self, section, items):
        for item in items:
            defaults = {
                'description': item.get('description', ''),
                'icon': item.get('icon', ''),
                'image_url': item.get('image_url', ''),
                'price': item.get('price', ''),
                'price_period': item.get('price_period', ''),
                'features': item.get('features', ''),
                'display_order': item.get('display_order', 0),
                'is_highlighted': item.get('is_highlighted', False),
                'button_text': item.get('button_text', ''),
                'button_url': item.get('button_url', ''),
                'metadata': item.get('metadata', ''),
            }
            SectionItem.objects.update_or_create(
                section=section,
                title=item['title'],
                defaults=defaults,
            )
