from django.db import migrations


def remove_initial_credential(apps, schema_editor):
    Credential = apps.get_model('core', 'Credential')
    admin = Credential.objects.filter(username='admin').first()
    if admin and Credential.objects.exclude(id=admin.id).exists():
        admin.delete()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0015_create_initial_credential'),
    ]

    operations = [
        migrations.RunPython(remove_initial_credential),
    ]
