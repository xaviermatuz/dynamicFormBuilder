from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.db.utils import IntegrityError
from psycopg.errors import UniqueViolation

# Centralized map of constraint names → friendly messages
CONSTRAINT_ERROR_MESSAGES = {
    "unique_form_name_version": "A form with this name and version already exists.",
    "unique_form_field_name": "Each field name must be unique within a form.",
    "unique_submission_per_user_per_version": "You have already submitted this form version.",
}


def custom_exception_handler(exc, context):
    # First, let DRF build the default response
    response = exception_handler(exc, context)

    # --- Handle IntegrityError globally ---
    if isinstance(exc, IntegrityError) and isinstance(exc.__cause__, UniqueViolation):
        detail = str(exc.__cause__)
        matched_message = None
        for constraint, message in CONSTRAINT_ERROR_MESSAGES.items():
            if constraint in detail:
                matched_message = message
                break

        if not matched_message:
            matched_message = "Duplicate entry violates a unique constraint."

        if response is not None:
            response.data = matched_message
        else:
            response = Response(
                matched_message,
                status=status.HTTP_400_BAD_REQUEST,
            )

    # --- Normalize other DRF errors ---
    elif response is not None:
        if "detail" in response.data:
            response.data = response.data["detail"]

    return response