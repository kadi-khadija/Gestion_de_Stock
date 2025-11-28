from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class UserModelTests(TestCase):

    def test_create_admin_user(self):
        user = User.objects.create_user(
            username="admin1",
            password="test123",
            role="admin"
        )
        self.assertEqual(user.role, "admin")
        self.assertTrue(user.check_password("test123"))

    def test_create_magasinier_user(self):
        user = User.objects.create_user(
            username="mag1",
            password="test123",
            role="magasinier"
        )
        self.assertEqual(user.role, "magasinier")

    def test_default_role_is_magasinier(self):
        user = User.objects.create_user(
            username="testuser",
            password="test123"
        )
        self.assertEqual(user.role, "magasinier")
