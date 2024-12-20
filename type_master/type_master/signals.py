from django.db.models.signals import post_save
from django.dispatch import receiver
from social_django.models import UserSocialAuth
from .models import UserSettings

@receiver(post_save, sender=UserSocialAuth)
def create_user_settings(sender, instance, created, **kwargs):
    if created:
        UserSettings.objects.create(user=instance)
