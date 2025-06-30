from django.core.management.base import BaseCommand
from core.models import SecurityPIN

class Command(BaseCommand):
    help = 'Setup initial security PIN'

    def add_arguments(self, parser):
        parser.add_argument('pin', type=str, help='4-digit PIN to set')

    def handle(self, *args, **options):
        pin = options['pin']
        
        if len(pin) != 4 or not pin.isdigit():
            self.stdout.write(
                self.style.ERROR('PIN must be exactly 4 digits')
            )
            return
        
        # Check if PIN already exists
        if SecurityPIN.get_active_pin():
            self.stdout.write(
                self.style.WARNING('PIN already exists. Use change_pin command to change it.')
            )
            return
        
        # Create new PIN
        SecurityPIN.objects.create(pin=pin, is_active=True)
        self.stdout.write(
            self.style.SUCCESS(f'Successfully set initial PIN: {pin}')
        ) 