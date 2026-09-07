import unittest
import io
from fastapi.testclient import TestClient
from app.main import app

class TestTeamMemberWorkflow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.admin_email = "lead_admin_teamtest@trizen.com"
        cls.admin_pwd = "password123"
        cls.member_a_email = "photographer_a@trizen.com"
        cls.member_a_pwd = "password123"
        cls.member_b_email = "photographer_b_unassigned@trizen.com"
        cls.member_b_pwd = "password123"

        cls.admin_token = None
        cls.member_a_token = None
        cls.member_b_token = None
        cls.member_a_id = None
        cls.member_b_id = None
        cls.event_id = None
        cls.member_photo_id = None
        cls.admin_photo_id = None

    def test_01_setup_users_and_tokens(self):
        """Setup Admin, Team Member A (assigned), and Team Member B (unassigned)"""
        # Register Admin
        self.client.post("/api/v1/auth/register", json={
            "name": "Team Test Admin",
            "email": self.admin_email,
            "password": self.admin_pwd,
            "role": "ADMIN"
        })
        login_admin = self.client.post("/api/v1/auth/login", json={
            "email": self.admin_email,
            "password": self.admin_pwd
        })
        self.assertEqual(login_admin.status_code, 200)
        TestTeamMemberWorkflow.admin_token = login_admin.json()["access_token"]

        # Register Member A
        self.client.post("/api/v1/auth/register", json={
            "name": "Photographer Alpha",
            "email": self.member_a_email,
            "password": self.member_a_pwd,
            "role": "TEAM_MEMBER"
        })
        login_a = self.client.post("/api/v1/auth/login", json={
            "email": self.member_a_email,
            "password": self.member_a_pwd
        })
        self.assertEqual(login_a.status_code, 200)
        TestTeamMemberWorkflow.member_a_token = login_a.json()["access_token"]
        TestTeamMemberWorkflow.member_a_id = login_a.json()["user"]["id"]
        self.assertEqual(login_a.json()["user"]["role"], "TEAM_MEMBER")

        # Register Member B
        self.client.post("/api/v1/auth/register", json={
            "name": "Photographer Beta",
            "email": self.member_b_email,
            "password": self.member_b_pwd,
            "role": "TEAM_MEMBER"
        })
        login_b = self.client.post("/api/v1/auth/login", json={
            "email": self.member_b_email,
            "password": self.member_b_pwd
        })
        self.assertEqual(login_b.status_code, 200)
        TestTeamMemberWorkflow.member_b_token = login_b.json()["access_token"]
        TestTeamMemberWorkflow.member_b_id = login_b.json()["user"]["id"]
        self.assertEqual(login_b.json()["user"]["role"], "TEAM_MEMBER")

    def test_02_create_event_and_assign_member_a_only(self):
        """Admin creates event and assigns Member A only"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        res = self.client.post("/api/v1/events", json={
            "title": "Chennai Beach Sunset Shoot",
            "description": "Golden hour editorial portraits",
            "member_ids": [self.member_a_id]
        }, headers=headers)
        self.assertEqual(res.status_code, 201)
        TestTeamMemberWorkflow.event_id = res.json()["id"]

    def test_03_team_member_views_assigned_events_only(self):
        """Requirement: Team member can view assigned events only"""
        # Member A (assigned) checks events list
        headers_a = {"Authorization": f"Bearer {self.member_a_token}"}
        res_a = self.client.get("/api/v1/events", headers=headers_a)
        self.assertEqual(res_a.status_code, 200)
        assigned_ids_a = [e["id"] for e in res_a.json()]
        self.assertIn(self.event_id, assigned_ids_a)

        # Member B (unassigned) checks events list
        headers_b = {"Authorization": f"Bearer {self.member_b_token}"}
        res_b = self.client.get("/api/v1/events", headers=headers_b)
        self.assertEqual(res_b.status_code, 200)
        assigned_ids_b = [e["id"] for e in res_b.json()]
        self.assertNotIn(self.event_id, assigned_ids_b)

        # Member B directly trying to access event details gets 403 Forbidden
        detail_b = self.client.get(f"/api/v1/events/{self.event_id}", headers=headers_b)
        self.assertEqual(detail_b.status_code, 403)

    def test_04_team_member_upload_photos(self):
        """Requirement: Team member can upload photos to assigned event"""
        headers_a = {"Authorization": f"Bearer {self.member_a_token}"}
        dummy_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
        files = [("files", ("member_a_shot_1.png", io.BytesIO(dummy_png), "image/png"))]
        data = {"event_id": self.event_id}

        upload_res = self.client.post("/api/v1/photos/upload", data=data, files=files, headers=headers_a)
        self.assertEqual(upload_res.status_code, 201)
        uploaded = upload_res.json()
        self.assertEqual(len(uploaded), 1)
        self.assertEqual(uploaded[0]["uploaded_by"], self.member_a_id)
        TestTeamMemberWorkflow.member_photo_id = uploaded[0]["id"]

        # Member B (unassigned) attempting upload gets 403 Forbidden
        headers_b = {"Authorization": f"Bearer {self.member_b_token}"}
        files_b = [("files", ("illegal_shot.png", io.BytesIO(dummy_png), "image/png"))]
        upload_b = self.client.post("/api/v1/photos/upload", data=data, files=files_b, headers=headers_b)
        self.assertEqual(upload_b.status_code, 403)

    def test_05_team_member_views_uploaded_photos(self):
        """Requirement: Team member can view their uploaded photos"""
        headers_a = {"Authorization": f"Bearer {self.member_a_token}"}
        view_res = self.client.get(f"/api/v1/photos/event/{self.event_id}", headers=headers_a)
        self.assertEqual(view_res.status_code, 200)
        photos = view_res.json()
        self.assertGreaterEqual(len(photos), 1)
        my_photo = next((p for p in photos if p["id"] == self.member_photo_id), None)
        self.assertIsNotNone(my_photo)
        self.assertEqual(my_photo["uploaded_by"], self.member_a_id)

    def test_06_team_member_cannot_publish_gallery(self):
        """Requirement: Team Members must not be able to publish galleries"""
        headers_a = {"Authorization": f"Bearer {self.member_a_token}"}
        publish_res = self.client.post("/api/v1/galleries/publish", json={
            "event_id": self.event_id,
            "pin": "123456"
        }, headers=headers_a)
        self.assertEqual(publish_res.status_code, 403)

    def test_07_team_member_cannot_select_photos_for_sharing(self):
        """Requirement: Team Members must not manage photo curation/selection"""
        headers_a = {"Authorization": f"Bearer {self.member_a_token}"}
        # Toggle selection forbidden
        toggle_res = self.client.patch(f"/api/v1/photos/{self.member_photo_id}/toggle-selection", headers=headers_a)
        self.assertEqual(toggle_res.status_code, 403)

        # Batch select forbidden
        batch_res = self.client.post("/api/v1/photos/batch-select", json={
            "photo_ids": [self.member_photo_id],
            "is_selected": True
        }, headers=headers_a)
        self.assertEqual(batch_res.status_code, 403)

    def test_08_team_member_cannot_manage_other_users_photos(self):
        """Requirement: Team Members must not manage other users' photos"""
        # Admin uploads a photo
        admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        dummy_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
        files = [("files", ("admin_exclusive_shot.png", io.BytesIO(dummy_png), "image/png"))]
        data = {"event_id": self.event_id}
        upload_admin = self.client.post("/api/v1/photos/upload", data=data, files=files, headers=admin_headers)
        self.assertEqual(upload_admin.status_code, 201)
        TestTeamMemberWorkflow.admin_photo_id = upload_admin.json()[0]["id"]

        # Team Member A attempts to delete Admin's photo -> Must be 403 Forbidden!
        headers_a = {"Authorization": f"Bearer {self.member_a_token}"}
        del_res = self.client.delete(f"/api/v1/photos/{self.admin_photo_id}", headers=headers_a)
        self.assertEqual(del_res.status_code, 403)

        # Team Member A can delete their OWN uploaded photo
        del_own = self.client.delete(f"/api/v1/photos/{self.member_photo_id}", headers=headers_a)
        self.assertEqual(del_own.status_code, 204)

if __name__ == "__main__":
    unittest.main()
