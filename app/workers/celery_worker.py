from celery import Celery
from ..config import settings

celery = Celery(
    "agentcloud",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

from ..services.axon_service import AxonService
from ..services.model_router import select_model


@celery.task(bind=True, max_retries=3)
def run_task(self, payload: str):
    print(f"Processing task payload: {payload!r}")
    try:
        # Step 0: Choose model via router (logging for now)
        choice = select_model(payload)
        print(f"ModelRouter selected '{choice.name}' ({choice.reason})")

        # Step 1: Advanced Reasoning (AXON engine)
        reasoning = AxonService.advanced_reasoning(payload)
        print(reasoning)

        # Step 2: Simulate execution
        if isinstance(payload, str) and "error" in payload.lower():
            raise Exception("Simulated execution failure")

        return f"Task completed successfully using {choice.name} with AXON reasoning"

    except Exception as e:
        # Step 3: Auto-healing logic
        healing_strategy = AxonService.auto_heal(str(e))
        print(f"Self-healing: {healing_strategy}")

        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=2 ** self.request.retries)
