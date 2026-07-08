import os
import django
import re

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "doh_clicker.settings")
django.setup()

from django.db import models
from django.contrib.auth.models import User

from main.models import Profile

from locust import HttpUser, task, between


import random

from locust import HttpUser, task, between

for i in range(100):
    username = f"locusttest{i}".format(i)
    user, created = User.objects.get_or_create(
        username=username
    )

    if created:
        user.set_password("12345678")
        user.save()

        Profile.objects.create(user=user)

class DogClicker(HttpUser):
    wait_time = between(0.1, 0.3)

    def on_start(self):
        user_id = random.randint(0, 99)

        self.username = f"locusttest{user_id}"
        self.password = "12345678"

        self.client.get("/login/")

        self.csrf = self.client.cookies["csrftoken"]

        self.client.post(
            "/login/",
            data={
                "username": self.username,
                "password": self.password,
                "csrfmiddlewaretoken": self.csrf,
            },
            headers={
                "Referer": "http://localhost:8000/login/",
                "X-CSRFToken": self.csrf,
            },
        )
        r = self.client.get("/dashboard/")
        match = re.search(
            r'<meta name="csrf-token" content="([^"]+)"',
            r.text
        )

        self.csrf = match.group(1)

    @task(10)
    def sync_income(self):
        response = self.client.post(
            "/api/click/",
            data={
                "clicks": random.randint(1, 8),
                "passive": 0,
            },
            headers={
                "X-CSRFToken": self.csrf,
                "Referer": "http://localhost:8000/dashboard/",
            },
        )
        if response.status_code != 200:
            print(response.text)

    @task(2)
    def upgrade(self):
        response = self.client.post(
            "/api/upgrade/",
            data={
                "level": random.randint(0, 2),
            },
            headers={
                "X-CSRFToken": self.csrf,
                "Referer": "http://localhost:8000/dashboard/",
            },
        )
        if response.status_code != 200:
            print(response.text)