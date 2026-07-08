from django.shortcuts import render, redirect,get_object_or_404

from django.contrib.auth.models import User

from django.views.decorators.csrf import csrf_exempt
from django.db import transaction

from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .serializers import *

from main.models import Profile, Upgrade, UserUpgrade, UserSettings


class BaseAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @property
    def profile(self):
        return self.request.user.profile 

    @property
    def user_settings(self):
        return self.request.user.settings

class UpgradeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        profile = Profile.objects.select_for_update().get(user=request.user)

        serializer = UpgradeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        level = serializer.validated_data["level"]

        upgrade = get_object_or_404(Upgrade, level=level)
        user_upgrade,_ = UserUpgrade.objects.get_or_create(
            user=profile,
            upgrade=upgrade
        )
        
        if profile.upgrade_level < level:
            return Response({"error": "locked"}, status=403)

        cost = round(upgrade.cost * (upgrade.growth_factor ** (user_upgrade.bought_count + (user_upgrade.bought_count ** 2) / 20)))
        if profile.coins < cost:
            return Response({"error": "not enough coins"}, status=403)

        profile.coins -= cost
        user_upgrade.bought_count += 1
        user_upgrade.save()
        next_cost = round(upgrade.cost * (upgrade.growth_factor ** (user_upgrade.bought_count + (user_upgrade.bought_count ** 2) / 20)))
        
        if upgrade.upg_type == 1:
            profile.coins_per_click += upgrade.value
        elif upgrade.upg_type == 2:
            profile.coins_per_second += upgrade.value
        else:
            return Response({"error": "bad type"}, status=400)

        profile.upgrade_level = max(profile.upgrade_level, level + 1)
        profile.save()

        data = ProfileSerializer(profile).data
        data["cost"] = cost
        data["next_cost"] = next_cost

        return Response(data)

class ClickAPIView(BaseAPIView):

    def post(self, request):
        profile = self.profile

        serializer = ClickSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        clicks = serializer.validated_data["clicks"]
        passive_coins = serializer.validated_data["passive"]

        max_passive = profile.coins_per_second * 12

        if passive_coins > max_passive:
            return Response({"error": "invalid passive"}, status=400)

        profile.coins += clicks * profile.coins_per_click + passive_coins
        profile.save()

        #print("profile.coins: ", profile.coins)

        return Response(ProfileSerializer(profile).data)

class SettingsAPIView(BaseAPIView):

    def post(self, request):
        global_volume = request.data.get("global_volume")
        soundtrack_volume = request.data.get("soundtrack_volume")

        settings = self.user_settings

        settings.global_volume = float(global_volume) / 100
        settings.soundtrack_volume = float(soundtrack_volume) / 100
        settings.save()

        return Response(UserSettingsSerializer(settings).data)
