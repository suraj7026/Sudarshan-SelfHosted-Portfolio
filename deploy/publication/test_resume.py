"""Offline webhook contract checks; queued processing functions are never executed."""
import importlib
import unittest
from fastapi import BackgroundTasks

worker = importlib.import_module("main")


class RequestFixture:
    """Minimal request supporting the webhook's JSON access."""

    def __init__(self, payload: dict[str, object] | None) -> None:
        self.payload = payload

    async def json(self) -> dict[str, object]:
        """Return test data or simulate malformed JSON."""
        if self.payload is None:
            raise ValueError("synthetic malformed JSON")
        return self.payload


class TestResumeWebhook(unittest.IsolatedAsyncioTestCase):
    """Check filtering and queuing without processing documents or contacting services."""

    async def test_health(self) -> None:
        self.assertEqual(await worker.health(), {"status": "ok"})

    async def test_valid_upload_only_enqueues(self) -> None:
        tasks = BackgroundTasks()
        result = await worker.minio_webhook(RequestFixture({
            "EventName": "s3:ObjectCreated:Put", "Key": "surajwebsite/resume/fixture.pdf"
        }), tasks)
        self.assertEqual(result["status"], "accepted")
        self.assertEqual(len(tasks.tasks), 1)
        self.assertEqual(tasks.tasks[0].args, ("resume/fixture.pdf",))

    async def test_irrelevant_events_do_not_enqueue(self) -> None:
        for event, key in [("s3:ObjectRemoved:Delete", "resume/fixture.pdf"),
                           ("s3:ObjectCreated:Put", "images/fixture.pdf"),
                           ("s3:ObjectCreated:Put", "resume/fixture.png")]:
            tasks = BackgroundTasks()
            result = await worker.minio_webhook(RequestFixture({"EventName": event, "Key": key}), tasks)
            self.assertEqual(result["status"], "ignored")
            self.assertEqual(len(tasks.tasks), 0)

    async def test_malformed_input_does_not_enqueue(self) -> None:
        tasks = BackgroundTasks()
        result = await worker.minio_webhook(RequestFixture(None), tasks)
        self.assertEqual(result["status"], "error")
        self.assertEqual(len(tasks.tasks), 0)


if __name__ == "__main__":
    unittest.main()
