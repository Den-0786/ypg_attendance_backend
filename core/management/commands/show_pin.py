from django.core.management.base import BaseCommand
from core.models import SecurityPIN

class Command(BaseCommand):
    help = 'Show current security PIN (for testing purposes)'

    def handle(self, *args, **options):
        active_pin = SecurityPIN.get_active_pin()
        
        if active_pin:
            self.stdout.write(
                self.style.SUCCESS(f'Current PIN: {active_pin.pin}')
            )
        else:
            self.stdout.write(
                self.style.WARNING('No PIN is set up.')
            ) 