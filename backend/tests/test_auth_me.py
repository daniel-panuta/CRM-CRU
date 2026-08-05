import asyncio
import json
import unittest
import uuid

from crud import create_user
from database import AsyncSessionLocal, init_db
from main import app
from middleware import hash_password


async def asgi_request(app, method, path, headers=None, json_body=None):
    body = b""
    if json_body is not None:
        body = json.dumps(json_body).encode("utf-8")
        headers = headers or {}
        headers["content-type"] = "application/json"

    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "method": method,
        "path": path,
        "raw_path": path.encode("utf-8"),
        "query_string": b"",
        "headers": [
            (k.lower().encode("utf-8"), v.encode("utf-8"))
            for k, v in (headers or {}).items()
        ],
        "client": ("127.0.0.1", 0),
        "server": ("127.0.0.1", 8000),
    }

    messages = []
    request_queue = asyncio.Queue()

    await request_queue.put({"type": "http.request", "body": body, "more_body": False})
    await request_queue.put({"type": "http.disconnect"})

    async def receive():
        return await request_queue.get()

    async def send(message):
        messages.append(message)

    await app(scope, receive, send)

    status = None
    response_headers = {}
    body_chunks = []

    for message in messages:
        if message["type"] == "http.response.start":
            status = message["status"]
            for name, value in message.get("headers", []):
                response_headers[name.decode()] = value.decode()
        elif message["type"] == "http.response.body":
            body_chunks.append(message.get("body", b""))

    return status, response_headers, b"".join(body_chunks)


class AuthMeTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        await init_db()
        self.email = f"test_auth_me_{uuid.uuid4().hex}@example.com"
        self.password = "TestPassword123"
        self.hashed_password = hash_password(self.password)

        async with AsyncSessionLocal() as session:
            user = await create_user(session, self.email, self.hashed_password, name="Test User")
            self.user_id = str(user["id"])

    async def test_auth_me_returns_user(self):
        status, _, body = await asgi_request(
            app,
            "POST",
            "/auth/login",
            json_body={"email": self.email, "password": self.password},
        )
        self.assertEqual(status, 200)
        auth_data = json.loads(body.decode("utf-8"))
        access_token = auth_data["access_token"]

        status, _, body = await asgi_request(
            app,
            "GET",
            "/auth/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        self.assertEqual(status, 200)
        user_data = json.loads(body.decode("utf-8"))
        self.assertEqual(user_data["email"], self.email)
        self.assertEqual(user_data["name"], "Test User")
        self.assertEqual(user_data["id"], self.user_id)
