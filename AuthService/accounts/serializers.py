from rest_framework import serializers
from django.contrib.auth import authenticate, get_user_model
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

User = get_user_model()

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get("username")
        password = data.get("password")

        if username and password:
            user = authenticate(username=username, password=password) #authenticate() gestion interne de Django avec hash du mot de passe
        else: # Si l’utilisateur n’existe pas ou mauvais mot de passe
            raise serializers.ValidationError("Veuillez fournir un nom d'utilisateur et un mot de passe")

        if not user:
            raise serializers.ValidationError("Identifiants incorrects")

        refresh = RefreshToken.for_user(user) # si ok 

        return {
            "refresh": str(refresh), #renvoie un token refresh
            "access": str(refresh.access_token), # renvoie un token access
            "user": { #renvoie les infos de l'utilisateur
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
            }
        }


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate(self, attrs):
        # just ensure the token parses
        try:
            self.token = RefreshToken(attrs["refresh"])
        except TokenError:
            raise serializers.ValidationError({"refresh": "Refresh token invalide."})
        return attrs

    def save(self, **kwargs):
        # blacklist it (requires token_blacklist app + migrations)
        self.token.blacklist()
