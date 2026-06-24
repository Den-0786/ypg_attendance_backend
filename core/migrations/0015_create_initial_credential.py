from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0014_remove_meeting_login_password_and_more'),
    ]

    operations = [
        migrations.RunPython(lambda apps, schema_editor: None),
    ]
