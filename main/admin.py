from django.contrib import admin
from .models import Upgrade, Profile, UserSettings

# Register your models here.

@admin.register(Upgrade)
class UpgradeAdmin(admin.ModelAdmin):
    list_display = ("id", "value", "upg_type", "level", "cost", "growth_factor")
    list_filter = ("upg_type",)
    ordering = ("upg_type", "level")

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "coins", "coins_per_click", "coins_per_second", "upgrade_level")
    list_filter = ("coins",)
    ordering = ("user", "coins")

@admin.register(UserSettings)
class SettingsAdmin(admin.ModelAdmin):
    list_display = ("user", "global_volume", "soundtrack_volume")
    list_filter = ("global_volume", "soundtrack_volume")
    ordering = ("user", "global_volume")