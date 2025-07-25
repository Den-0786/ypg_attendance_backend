from rest_framework_simplejwt.authentication import JWTAuthentication
from core.models import Credential

class CredentialJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user_id = validated_token.get('user_id')
        if user_id is None:
            return None
        try:
            return Credential.objects.get(id=user_id)
        except Credential.DoesNotExist:
            return None 