from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

def get_token(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)

class MeEndpointTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            password="test123",
            role="magasinier"
        )
        self.me_url  = "/api/auth/magasinier-only/" 

    def test_access_me_authenticated(self):
        token = get_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + token)
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        

    def test_access_me_unauthenticated(self):
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
