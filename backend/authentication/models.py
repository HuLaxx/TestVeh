from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('Customer', 'Customer'),
        ('Operator', 'Operator'),
        ('Admin', 'Admin'),
    ]
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True, blank=False)
    phone_number = models.CharField(max_length=15, unique=True, blank=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Customer')
    authentication_key = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.username
