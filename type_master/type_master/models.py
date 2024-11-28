from django.db import models
from social_django.models import UserSocialAuth

class Word(models.Model):
    word_id =   models.AutoField(primary_key=True)
    word    =   models.CharField(max_length=255)
    length  =   models.IntegerField()
    lang    =   models.CharField(max_length=50)
    
    def __str__(self):
        return self.word

class UserSettings(models.Model):
    user                    =   models.OneToOneField(UserSocialAuth, on_delete=models.CASCADE, primary_key=True)
    theme                   =   models.CharField(max_length=10, default="dark")
    font_family             =   models.CharField(max_length=100, default="VT323")
    font_size               =   models.CharField(max_length=6, default="40px")
    ultra_wide_config       =   models.CharField(max_length=10, default='center')
    mode_used               =   models.CharField(max_length=10, default="time", null=False)
    time_selected           =   models.IntegerField(default=15, null=False)
    word_amount_selected    =   models.IntegerField(default=15, null=False)
    challenge_achieved      =   models.JSONField(default=[0,0,0,0,0,0,0,0,0])
    custome_sentence        =   models.CharField(max_length=255, default="The quick brown fox jumps over the lazy dog.")
    last_updated            =   models.DateTimeField(auto_now=True)
    
    def to_dict(self):
        return {
            'user':                 self.user.user.username,
            'theme':                self.theme,
            "font_family":          self.font_family,
            'font_size':            self.font_size,
            'ultra_wide_config':    self.ultra_wide_config,
            'mode_used':            self.mode_used,
            'time_selected':        self.time_selected,
            'word_amount_selected': self.word_amount_selected,
            'challenge_achieved':   self.challenge_achieved,
            'custome_sentence':     self.custome_sentence,
            'last_updated':         self.last_updated,
        }
        

class TestHistory(models.Model):
    id          =   models.AutoField(primary_key=True)
    user        =   models.ForeignKey(UserSocialAuth, on_delete=models.CASCADE)
    wpm         =   models.FloatField()
    accuracy    =   models.FloatField()
    cormisex    =   models.CharField(max_length=20)
    mode        =   models.CharField(max_length=10)
    type        =   models.CharField(max_length=20)
    bpr         =   models.BooleanField(default=False)
    test_taken  =   models.DateTimeField(auto_now=True)

    def to_dict(self):
        return {
            "id":           self.id,
            "wpm":          self.wpm,
            "accuracy":     self.accuracy,
            "cormisex":     self.cormisex,
            "mode":         self.mode,
            "type":         self.type,
            "bpr":          self.bpr,
            "test_taken":   self.test_taken.isoformat()
        }


class bsitTypingMaster(models.Model):
    id  = models.AutoField(primary_key=True)
    code = models.CharField(max_length=10)
    name = models.CharField(max_length=255)
    host = models.ForeignKey(UserSocialAuth, on_delete=models.CASCADE)
    date_created = models.DateField(auto_now=True)
    test_time = models.IntegerField(default=15)
    test_ammount = models.IntegerField(default=0)
    is_started = models.BooleanField(default=False)

class bsitTypeingMasterPlayers(models.Model):
    id = models.AutoField(primary_key=True)
    user =  models.ForeignKey(UserSocialAuth, on_delete=models.CASCADE)
    lobby = models.ForeignKey(bsitTypingMaster, on_delete=models.CASCADE)
    is_can_play = models.BooleanField(default=True)

