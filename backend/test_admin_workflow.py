import unittest
import io
from fastapi.testclient import TestClient
from app.main import app

class TestAdminLeadWorkflow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.admin_email = "admin_lead_test@trizen.com"
        cls.admin_password = "password123"
        cls.team_email = "photographer_test@trizen.com"
        cls.team_password = "password123"
        cls.admin_token = None
        cls.team_member_id = None
        cls.event_id = None
        cls.photo_id = None
        cls.share_slug = None
        cls.pin = "482917"

    def test_01_register_or_login_admin(self):
        """Requirement: Admin can Register/Login"""
        # Try registering admin
        reg_res = self.client.post("/api/v1/auth/register", json={
            "name": "Test Studio Lead",
            "email": self.admin_email,
            "password": self.admin_password,
            "role": "ADMIN"
        })
        self.assertIn(reg_res.status_code, [201, 400])

        # Login admin
        login_res = self.client.post("/api/v1/auth/login", json={
            "email": self.admin_email,
            "password": self.admin_password
        })
        self.assertEqual(login_res.status_code, 200)
        data = login_res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["role"], "ADMIN")
        TestAdminLeadWorkflow.admin_token = data["access_token"]

    def test_02_add_team_member(self):
        """Requirement: Admin can Add team members"""
        # Register a team member photographer
        reg_res = self.client.post("/api/v1/auth/register", json={
            "name": "Test Photographer",
            "email": self.team_email,
            "password": self.team_password,
            "role": "TEAM_MEMBER"
        })
        self.assertIn(reg_res.status_code, [201, 400])

        # Admin fetches team members
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        members_res = self.client.get("/api/v1/auth/team-members", headers=headers)
        self.assertEqual(members_res.status_code, 200)
        members = members_res.json()
        self.assertGreater(len(members), 0)
        team_member = next((m for m in members if m["email"] == self.team_email), None)
        self.assertIsNotNone(team_member)
        TestAdminLeadWorkflow.team_member_id = team_member["id"]

    def test_03_create_event(self):
        """Requirement: Admin can Create an event"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        create_res = self.client.post("/api/v1/events/", json={
            "title": "Arjun & Priya Wedding Test",
            "description": "Grand Celebration at Royal Palace",
            "member_ids": [self.team_member_id]
        }, headers=headers)
        self.assertEqual(create_res.status_code, 201)
        event_data = create_res.json()
        self.assertEqual(event_data["title"], "Arjun & Priya Wedding Test")
        self.assertGreaterEqual(len(event_data["members"]), 1)
        TestAdminLeadWorkflow.event_id = event_data["id"]

    def test_04_manage_event_team_members(self):
        """Requirement: Admin can Add/update team members on existing event"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        assign_res = self.client.post(f"/api/v1/events/{self.event_id}/members", json={
            "user_ids": [self.team_member_id]
        }, headers=headers)
        self.assertEqual(assign_res.status_code, 200)
        event_data = assign_res.json()
        assigned_ids = [m["id"] for m in event_data["members"]]
        self.assertIn(self.team_member_id, assigned_ids)

    def test_05_upload_and_view_all_photos(self):
        """Requirement: Admin can View all photos uploaded by the team"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Upload a test dummy image
        file_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
        files = [("files", ("ceremony_photo_1.png", io.BytesIO(file_content), "image/png"))]
        data = {"event_id": self.event_id}

        upload_res = self.client.post("/api/v1/photos/upload", data=data, files=files, headers=headers)
        self.assertEqual(upload_res.status_code, 201)
        uploaded = upload_res.json()
        self.assertEqual(len(uploaded), 1)
        TestAdminLeadWorkflow.photo_id = uploaded[0]["id"]

        # View all photos for the event
        view_res = self.client.get(f"/api/v1/photos/event/{self.event_id}", headers=headers)
        self.assertEqual(view_res.status_code, 200)
        photos = view_res.json()
        self.assertGreaterEqual(len(photos), 1)
        self.assertEqual(photos[0]["filename"], "ceremony_photo_1.png")
        self.assertIn("uploader_name", photos[0])

    def test_06_select_photos_for_sharing(self):
        """Requirement: Admin can Select photos for sharing"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Toggle photo selection to True
        toggle_res = self.client.patch(f"/api/v1/photos/{self.photo_id}/toggle-selection", headers=headers)
        self.assertEqual(toggle_res.status_code, 200)
        photo_data = toggle_res.json()
        self.assertTrue(photo_data["is_selected"])

        # Batch select
        batch_res = self.client.post("/api/v1/photos/batch-select", json={
            "photo_ids": [self.photo_id],
            "is_selected": True
        }, headers=headers)
        self.assertEqual(batch_res.status_code, 200)

    def test_07_publish_gallery_and_set_pin(self):
        """Requirement: Admin can Create/publish gallery, Set PIN, and Generate shareable link"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        publish_res = self.client.post("/api/v1/gallery/publish", json={
            "event_id": self.event_id,
            "pin": self.pin
        }, headers=headers)
        self.assertEqual(publish_res.status_code, 200)
        gallery_data = publish_res.json()
        self.assertTrue(gallery_data["is_published"])
        self.assertIsNotNone(gallery_data["share_slug"])
        self.assertGreater(len(gallery_data["share_slug"]), 0)
        TestAdminLeadWorkflow.share_slug = gallery_data["share_slug"]

    def test_08_verify_gallery_link_and_pin(self):
        """Verify: Generated shareable link & PIN access work correctly"""
        # 1. Unauthenticated customer checks metadata
        meta_res = self.client.get(f"/api/v1/gallery/public/{self.share_slug}/meta")
        self.assertEqual(meta_res.status_code, 200)
        self.assertEqual(meta_res.json()["share_slug"], self.share_slug)
        self.assertTrue(meta_res.json()["is_published"])

        # 2. Customer enters incorrect PIN
        wrong_pin_res = self.client.post(f"/api/v1/gallery/public/{self.share_slug}/access", json={
            "pin": "000000"
        })
        self.assertEqual(wrong_pin_res.status_code, 401)

        # 3. Customer enters correct PIN
        correct_pin_res = self.client.post(f"/api/v1/gallery/public/{self.share_slug}/access", json={
            "pin": self.pin
        })
        self.assertEqual(correct_pin_res.status_code, 200)
        photos = correct_pin_res.json()["photos"]
        self.assertGreaterEqual(len(photos), 1)
        self.assertTrue(photos[0]["is_selected"])

if __name__ == "__main__":
    unittest.main()
