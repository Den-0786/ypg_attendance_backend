from django.core.management.base import BaseCommand
from core.models import Credential


class Command(BaseCommand):
    help = 'Create an initial admin credential if none exists (for Render or similar platforms)'

    def handle(self, *args, **options):
        if not Credential.objects.filter(username='admin').exists():
            credential = Credential(username='admin', role='admin')
            credential.set_password('admin123')
            credential.save()
            self.stdout.write(
                self.style.SUCCESS('Initial admin credential created: admin / admin123')
            )
        else:
            self.stdout.write(
                self.style.WARNING('Admin credential already exists.')
            )
