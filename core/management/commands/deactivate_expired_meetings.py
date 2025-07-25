from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from core.models import Meeting


class Command(BaseCommand):
    help = 'Deactivate meetings that have been active for more than 24 hours'

    def handle(self, *args, **options):
        # Get all active meetings
        active_meetings = Meeting.objects.filter(is_active=True)
        
        # Calculate the cutoff time (24 hours ago)
        cutoff_time = timezone.now() - timedelta(hours=24)
        
        # Find meetings created more than 24 hours ago
        expired_meetings = active_meetings.filter(created_at__lt=cutoff_time)
        
        if expired_meetings.exists():
            # Deactivate expired meetings
            count = expired_meetings.update(is_active=False)
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully deactivated {count} meeting(s) that were active for more than 24 hours'
                )
            )
            
            # Log the deactivated meetings
            for meeting in expired_meetings:
                self.stdout.write(
                    f'Deactivated: {meeting.title} (created: {meeting.created_at})'
                )
        else:
            self.stdout.write(
                self.style.SUCCESS('No meetings found that need to be deactivated')
            ) 