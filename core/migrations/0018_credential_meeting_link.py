from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0017_add_meeting_login_credentials'),
    ]

    operations = [
        migrations.AddField(
            model_name='credential',
            name='meeting',
            field=models.ForeignKey(
                blank=True,
                help_text='Set when this credential is for meeting-member login',
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='member_credentials',
                to='core.meeting',
            ),
        ),
    ]
