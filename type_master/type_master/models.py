from django.db import models
from social_django.models import UserSocialAuth

class Word(models.Model):
    word_id = models.AutoField(primary_key=True)
    word = models.CharField(max_length=255)
    length = models.IntegerField()
    lang = models.CharField(max_length=50)
    def __str__(self):
        return self.word

class UserSettings(models.Model):
    social_auth = models.ForeignKey(UserSocialAuth, on_delete=models.CASCADE)
    theme = models.CharField(max_length=10, default="dark")
    
