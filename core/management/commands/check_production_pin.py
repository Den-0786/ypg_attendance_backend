from django.core.management.base import BaseCommand
from core.models import SecurityPIN, LoginAttempt

class Command(BaseCommand):
    help = 'Check PIN status and database connectivity in production'

    def handle(self, *args, **options):
        self.stdout.write("Checking PIN status in production...")
        
        try:
            # Check if SecurityPIN table exists and has data
            pin_count = SecurityPIN.objects.count()
            self.stdout.write(f"Total PINs in database: {pin_count}")
            
            active_pin = SecurityPIN.objects.filter(is_active=True).first()
            if active_pin:
                self.stdout.write(
                    self.style.SUCCESS(f'Active PIN found: {active_pin.pin}')
                )
                
                # Test PIN verification
                is_valid = SecurityPIN.verify_pin(active_pin.pin)
                self.stdout.write(f"PIN verification test: {is_valid}")
                
            else:
                self.stdout.write(
                    self.style.WARNING('No active PIN found in database')
                )
                
            # Check LoginAttempt table
            attempt_count = LoginAttempt.objects.count()
            self.stdout.write(f"Total LoginAttempt records: {attempt_count}")
            
            # Test LoginAttempt creation
            test_attempt = LoginAttempt.get_or_create_attempt("test_ip", "pin")
            self.stdout.write(f"LoginAttempt test: {test_attempt}")
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Database error: {str(e)}')
            )
