from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth.models import User, Group
from api.v1.models import FormDefinition, FormSubmission


class FormDefinitionAndSubmissionAPITests(TestCase):
    """
    Integration tests for FormDefinition (forms) and FormSubmission (submissions).
    Covers role-based access for Admin, Editor, and Viewer.
    """

    def setUp(self):
        self.client = APIClient()

        # Ensure groups exist
        self.admin_group, _ = Group.objects.get_or_create(name="Admin")
        self.editor_group, _ = Group.objects.get_or_create(name="Editor")
        self.viewer_group, _ = Group.objects.get_or_create(name="Viewer")

        # Create users for each role
        self.admin_user = User.objects.create_user(username="admin_user", password="pass123")
        self.admin_user.groups.add(self.admin_group)

        self.editor_user = User.objects.create_user(username="editor_user", password="pass123")
        self.editor_user.groups.add(self.editor_group)

        self.viewer_user = User.objects.create_user(username="viewer_user", password="pass123")
        self.viewer_user.groups.add(self.viewer_group)

        # Pre-create a form (used for submissions)
        self.form = FormDefinition.objects.create(
            name="Test Form", description="Form for submissions", created_by=self.admin_user
        )

    def authenticate_as(self, user):
        """Helper: Authenticate client as a given user."""
        self.client.force_authenticate(user=user)

    # -------------------------------
    # FORM TESTS
    # -------------------------------

    def test_admin_can_create_form(self):
        """Admin should be able to create forms."""
        self.authenticate_as(self.admin_user)
        payload = {"name": "Admin Form", "description": "Created by Admin", "fields": []}
        response = self.client.post("/api/v1/forms/", payload, format="json")
        self.assertEqual(response.status_code, 201)

    def test_editor_can_soft_delete_form(self):
        """Editor can soft delete (PATCH) but not hard delete."""
        self.authenticate_as(self.editor_user)
        form = FormDefinition.objects.create(name="Soft Delete", description="", created_by=self.editor_user)
        response = self.client.patch(f"/api/v1/forms/{form.id}/", {"is_deleted": True}, format="json")
        self.assertEqual(response.status_code, 200)

    def test_viewer_can_list_forms(self):
        """Viewer can only list forms, not create or delete."""
        self.authenticate_as(self.viewer_user)
        response = self.client.get("/api/v1/forms/")
        self.assertEqual(response.status_code, 200)

    # -------------------------------
    # SUBMISSION TESTS
    # -------------------------------

    def test_admin_can_submit(self):
        """Admin can create a submission for any form."""
        self.authenticate_as(self.admin_user)
        payload = {"form": self.form.id, "data": {"full_name": "Alice", "age": 30}}
        response = self.client.post("/api/v1/submissions/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        submission = FormSubmission.objects.first()
        self.assertEqual(submission.submitted_by, self.admin_user)

    def test_editor_can_submit(self):
        """Editor can create submissions as well."""
        self.authenticate_as(self.editor_user)
        payload = {"form": self.form.id, "data": {"full_name": "Bob", "age": 25}}
        response = self.client.post("/api/v1/submissions/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        submission = FormSubmission.objects.filter(submitted_by=self.editor_user).first()
        self.assertIsNotNone(submission)

    def test_viewer_can_submit(self):
        """Viewer is allowed to submit (primary purpose)."""
        self.authenticate_as(self.viewer_user)
        payload = {"form": self.form.id, "data": {"full_name": "Charlie", "age": 40}}
        response = self.client.post("/api/v1/submissions/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        submission = FormSubmission.objects.filter(submitted_by=self.viewer_user).first()
        self.assertIsNotNone(submission)

    def test_viewer_cannot_delete_submission(self):
        """Viewer should not be able to delete submissions."""
        self.authenticate_as(self.viewer_user)
        submission = FormSubmission.objects.create(form=self.form, submitted_by=self.viewer_user, data={})
        response = self.client.delete(f"/api/v1/submissions/{submission.id}/")
        self.assertEqual(response.status_code, 403)

    def test_editor_cannot_hard_delete_submission(self):
        """Editor should not be able to hard delete submissions (only soft delete if allowed)."""
        self.authenticate_as(self.editor_user)
        submission = FormSubmission.objects.create(form=self.form, submitted_by=self.editor_user, data={})
        response = self.client.delete(f"/api/v1/submissions/{submission.id}/")
        self.assertEqual(response.status_code, 403)

    def test_admin_can_delete_submission(self):
        """Admin can fully delete submissions."""
        self.authenticate_as(self.admin_user)
        submission = FormSubmission.objects.create(form=self.form, submitted_by=self.admin_user, data={})
        response = self.client.delete(f"/api/v1/submissions/{submission.id}/")
        self.assertEqual(response.status_code, 204)
