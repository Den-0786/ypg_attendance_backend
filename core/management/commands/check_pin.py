from django.core.management.base import BaseCommand
from core.models import SecurityPIN

class Command(BaseCommand):
    help = 'Check security PIN status'

    def handle(self, *args, **options):
        active_pin = SecurityPIN.get_active_pin()
        
        if active_pin:
            self.stdout.write(
                self.style.SUCCESS(f'PIN is set up (created: {active_pin.created_at})')
            )
        else:
            self.stdout.write(
                self.style.WARNING('No PIN is set up. Use setup_pin command to create one.')
            ) 