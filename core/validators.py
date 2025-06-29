import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _

class CustomPasswordValidator:
    """
    Custom password validator that enforces:
    - Exactly 8 characters
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 number
    - At least 1 special character
    """
    
    def validate(self, password, user=None):
        # Check exact length of 8 characters
        if len(password) != 8:
            raise ValidationError(
                _("Password must be exactly 8 characters long."),
                code="password_exact_length",
            )
        
        # Check for at least 1 uppercase letter
        if not re.search(r'[A-Z]', password):
            raise ValidationError(
                _("Password must contain at least 1 uppercase letter."),
                code="password_no_uppercase",
            )
        
        # Check for at least 1 lowercase letter
        if not re.search(r'[a-z]', password):
            raise ValidationError(
                _("Password must contain at least 1 lowercase letter."),
                code="password_no_lowercase",
            )
        
        # Check for at least 1 number
        if not re.search(r'\d', password):
            raise ValidationError(
                _("Password must contain at least 1 number."),
                code="password_no_number",
            )
        
        # Check for at least 1 special character
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', password):
            raise ValidationError(
                _("Password must contain at least 1 special character."),
                code="password_no_special",
            )
    
    def get_help_text(self):
        return _(
            "Your password must be exactly 8 characters long and contain at least "
            "1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character."
        )

def validate_password_custom(password):
    """
    Standalone function to validate password with custom rules
    Returns (is_valid, error_message)
    """
    validator = CustomPasswordValidator()
    try:
        validator.validate(password)
        return True, None
    except ValidationError as e:
        return False, str(e) 