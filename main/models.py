from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    coins = models.BigIntegerField(default=0)
    coins_per_click = models.BigIntegerField(default=1)
    coins_per_second = models.BigIntegerField(default=0)
    upgrade_level = models.IntegerField(default=0)

    def __str__(self):
        return self.user.username

class Upgrade(models.Model):
    level = models.IntegerField(unique=True)
    cost = models.IntegerField() #ціна прокачки
    upg_type = models.IntegerField() #тип
    value = models.IntegerField() #на скільки прокачка
    growth_factor = models.FloatField(default=1) #ріст ціни

    name = models.TextField(default="placeholder")
    image = models.TextField(default="smiley_doh.png")

class UserUpgrade(models.Model):
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="upgrades")
    upgrade = models.ForeignKey(Upgrade, on_delete=models.CASCADE, related_name="user_upgrades")

    bought_count = models.IntegerField(default=0)

class UserSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="settings")

    global_volume = models.FloatField(default=0.5)
    soundtrack_volume = models.FloatField(default=0.5)

    def __str__(self):
        return f"{self.user.username} Settings"