from django.db import models

class Word(models.Model):
    word_id = models.AutoField(primary_key=True)
    word = models.CharField(max_length=255)
    length = models.IntegerField()
    lang = models.CharField(max_length=50)
    special_charact = models.BooleanField(default=False)

    def __str__(self):
        return self.word
