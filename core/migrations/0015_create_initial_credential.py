from django.db import migrations
from django.contrib.auth.hashers import make_password


def create_initial_credential(apps, schema_editor):
    Credential = apps.get_model('core', 'Credential')
    if not Credential.objects.filter(username='admin').exists():
        Credential.objects.create(
            username='admin',
            password=make_password('Ahinde@2'),
            role='admin'
        )


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0014_remove_meeting_login_password_and_more'),
    ]

    operations = [
        migrations.RunPython(create_initial_credential),
    ]
