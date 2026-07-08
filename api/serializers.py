from rest_framework import serializers
from main.models import *

class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = [
            "global_volume",
            "soundtrack_volume",
        ]

class ProfileSerializer(serializers.ModelSerializer):
    level = serializers.IntegerField(source="upgrade_level")

    class Meta:
        model = Profile
        fields = [
            "coins",
            "coins_per_click",
            "coins_per_second",
            "level",
        ]

class ClickSerializer(serializers.Serializer):
    clicks = serializers.IntegerField(min_value=0, max_value=120)
    passive = serializers.FloatField(min_value=0)

class UpgradeRequestSerializer(serializers.Serializer):
    level = serializers.IntegerField(min_value=0)