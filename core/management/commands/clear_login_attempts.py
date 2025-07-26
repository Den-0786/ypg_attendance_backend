from django.core.management.base import BaseCommand
from core.models import LoginAttempt


class Command(BaseCommand):
    help = 'Clear all login attempts (useful for testing)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--identifier',
            type=str,
            help='Clear attempts for specific identifier (username or IP)',
        )
        parser.add_argument(
            '--type',
            type=str,
            choices=['username_password', 'pin'],
            help='Clear attempts for specific type',
        )

    def handle(self, *args, **options):
        identifier = options.get('identifier')
        attempt_type = options.get('type')
        
        queryset = LoginAttempt.objects.all()
        
        if identifier:
            queryset = queryset.filter(identifier=identifier)
            self.stdout.write(f'Filtering by identifier: {identifier}')
            
        if attempt_type:
            queryset = queryset.filter(attempt_type=attempt_type)
            self.stdout.write(f'Filtering by type: {attempt_type}')
        
        count = queryset.count()
        queryset.delete()
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully cleared {count} login attempt(s)')
        ) 