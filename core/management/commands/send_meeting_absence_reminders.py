from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db.models import Count
from django.utils import timezone

from core.models import ApologyEntry, AttendanceEntry, LocalContact, Meeting
from core.sms import send_sms


DEFAULT_LIMITS = {'general': 5, 'council': 2, 'emergency': None}


class Command(BaseCommand):
    help = (
        "SMS local leaders whose congregation fell short of the expected "
        "attendance for meetings that closed about an hour ago."
    )

    def handle(self, *args, **options):
        now = timezone.now()
        # Meetings that closed 60-120 minutes ago and haven't been processed.
        window_start = now - timedelta(hours=2)
        window_end = now - timedelta(hours=1)

        meetings = Meeting.objects.filter(
            absence_reminder_sent_at__isnull=True,
        )
        processed = 0
        reminded = 0

        for meeting in meetings:
            end = meeting.get_end_datetime()
            if not (window_start <= end <= window_end):
                continue

            limit = meeting.custom_participant_limit or DEFAULT_LIMITS.get(
                meeting.meeting_type
            )
            if limit is None:
                # No expectation defined (e.g. emergency meetings) - nothing to compare.
                meeting.absence_reminder_sent_at = now
                meeting.save(update_fields=['absence_reminder_sent_at'])
                processed += 1
                continue

            counts = {
                row['congregation'].strip().lower(): row['n']
                for row in AttendanceEntry.objects.filter(
                    meeting_date=meeting.date, type='local', is_deleted=False,
                ).values('congregation').annotate(n=Count('id'))
            }

            apologised = {
                name.strip().lower()
                for name in ApologyEntry.objects.filter(
                    meeting_date=meeting.date,
                ).values_list('congregation', flat=True)
            }

            for contact in LocalContact.objects.all():
                local_key = contact.name.strip().lower()
                submitted = counts.get(local_key, 0)
                if submitted >= limit or local_key in apologised:
                    continue

                message = (
                    f"YPG Attendance: {contact.name} recorded {submitted} of the "
                    f"{limit} expected attendees for today's {meeting.get_meeting_type_display()} "
                    f"({meeting.title}). Kindly follow up with your members."
                )
                if send_sms(contact.phone, message):
                    self.stdout.write(self.style.SUCCESS(f"Reminder sent to {contact.name}"))
                    reminded += 1

            meeting.absence_reminder_sent_at = now
            meeting.save(update_fields=['absence_reminder_sent_at'])
            processed += 1

        self.stdout.write(
            self.style.SUCCESS(f"Processed {processed} meeting(s), sent {reminded} reminder(s)")
        )
