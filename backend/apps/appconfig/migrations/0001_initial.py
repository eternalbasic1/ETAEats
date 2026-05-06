from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='AppVersionConfig',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('app_name', models.CharField(
                    choices=[
                        ('passenger', 'Passenger'),
                        ('restaurant', 'Restaurant'),
                        ('admin', 'Admin'),
                    ],
                    max_length=20,
                    unique=True,
                )),
                ('min_required_version', models.CharField(max_length=20)),
                ('is_active', models.BooleanField(default=True)),
                ('update_message', models.TextField(default='A new version of the app is required.')),
                ('android_store_url', models.URLField(blank=True, default='')),
                ('ios_store_url', models.URLField(blank=True, default='')),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
