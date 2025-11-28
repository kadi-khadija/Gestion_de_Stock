from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

class JWTAuthenticationTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="admin1",
            password="adminpass",
            role="admin"
        )
        self.url = "/api/auth/login/"

    def test_get_jwt_token(self):
        response = self.client.post(self.url, {
            "username": "admin1",
            "password": "adminpass"
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_wrong_password(self):
        response = self.client.post(self.url, {
            "username": "admin1",
            "password": "wrongpass"
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

