from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Seed ALL data: CMS, subscriptions, workouts, meal plans, achievements, challenges, coupons'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear existing data before seeding')

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('\n🌱 Starting complete database seeding...\n'))

        self.stdout.write('📄 Seeding CMS content and subscription plans...')
        if options.get('clear'):
            call_command('seed_demo_data', '--clear')
        else:
            call_command('seed_demo_data')

        self.stdout.write('\n💪 Seeding workouts, exercises, and meal plans...')
        call_command('seed_fitness_data')

        self.stdout.write('\n🏆 Seeding achievements, challenges, and coupons...')
        call_command('seed_core_data')

        self.stdout.write(self.style.SUCCESS('\n✅ ALL DATA SEEDED SUCCESSFULLY!\n'))
        self.stdout.write('Demo users:')
        self.stdout.write('  demo@fitcoachpro.com / demo1234')
        self.stdout.write('  john@example.com / demo1234')
        self.stdout.write('  jane@example.com / demo1234\n')
        self.stdout.write('Run: python manage.py createsuperuser  — for admin access\n')
