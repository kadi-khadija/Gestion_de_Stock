from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def get_token(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)

class PermissionTests(APITestCase):

    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin",
            password="adminpass",
            role="admin"
        )

        self.mag = User.objects.create_user(
            username="mag",
            password="magpass",
            role="magasinier"
        )

        self.admin_url = "/api/auth/admin-only/"
        self.mag_url = "/api/auth/magasinier-only/"

    # ----------- ADMIN TESTS -----------

    def test_admin_can_access_admin_route(self):
        token = get_token(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + token)
        response = self.client.get(self.admin_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_can_access_mag_route(self):
        token = get_token(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + token)
        response = self.client.get(self.mag_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # ----------- MAGASINIER TESTS -----------

    def test_mag_can_access_mag_route(self):
        token = get_token(self.mag)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + token)
        response = self.client.get(self.mag_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_mag_cannot_access_admin_route(self):
        token = get_token(self.mag)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + token)
        response = self.client.get(self.admin_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ----------- UNAUTHENTICATED -----------

    def test_unauthenticated_user_gets_401(self):
        response = self.client.get(self.admin_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
