from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import login as auth_login, authenticate
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction

import re
import json

from .models import Profile, Upgrade, UserUpgrade, UserSettings


def index(request):
    if request.user.is_authenticated:
        return redirect("/dashboard/")
    return render(request, "main/index.html")

def register(request):
    if request.user.is_authenticated:
        return redirect("/dashboard/")
    if request.method == "POST":
        body = json.loads(request.body)
        nickname = body.get("nickname")
        username = body.get("username")
        password = body.get("password")

        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'The Username is already occupied'})

        user = User.objects.create_user(username=username, password=password)
        Profile.objects.create(user=user)

        auth_login(request, user)
        return JsonResponse({'success': True})

    return render(request, "main/register.html")

def login(request):
    if request.user.is_authenticated:
        return redirect("/dashboard/")
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            auth_login(request, user)
            return redirect('/dashboard/')
        else:
            return render(request, 'main/login.html', {'error': 'Incorrect name or password'})

    return render(request, "main/login.html")

@login_required(login_url='/login/')
def dashboard(request):
    profile = request.user.profile

    settings, created = UserSettings.objects.get_or_create(user=request.user)

    for upgrade in Upgrade.objects.all():
        UserUpgrade.objects.get_or_create(
            user=profile,
            upgrade=upgrade
        )

    upgrades = Upgrade.objects.all()

    user_upgrades_qs = UserUpgrade.objects.filter(user=profile)
    user_upgrades = {
        upgrade.upgrade_id: upgrade for upgrade in user_upgrades_qs
    }

    upgrades_data = []

    for upgrade in upgrades:
        user_upgrade = user_upgrades.get(upgrade.id)
        bought = user_upgrade.bought_count if user_upgrade else 0

        next_cost = round(upgrade.cost * (upgrade.growth_factor ** (user_upgrade.bought_count + (user_upgrade.bought_count ** 2) / 20)))

        upgrades_data.append({
            "level": upgrade.level,
            "upg_type": upgrade.upg_type,
            "value": upgrade.value,
            "bought_count": bought,
            "next_cost": next_cost,
            "name": upgrade.name,
            "image": upgrade.image
        })
    print("dashboard: ", request.user.profile.coins)
    return render(request, 'main/dashboard.html', {
        "profile": profile,
        "upgrades": upgrades_data,
        "global_volume": int(request.user.settings.global_volume * 100),
        "soundtrack_volume": int(request.user.settings.soundtrack_volume * 100)
    })


