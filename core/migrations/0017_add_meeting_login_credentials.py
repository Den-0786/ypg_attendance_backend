from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0016_remove_initial_credential'),
    ]

    operations = [
        migrations.AddField(
            model_name='meeting',
            name='login_username',
            field=models.CharField(blank=True, max_length=150, null=True),
        ),
        migrations.AddField(
            model_name='meeting',
            name='login_password',
            field=models.CharField(blank=True, max_length=128, null=True),
        ),
    ]
