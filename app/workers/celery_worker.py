from celery import Celery
from ..config import settings

celery = Celery(
    "agentcloud",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

from ..services.axon_service import AxonService

@celery.task(bind=True, max_retries=3)
def run_task(self, payload):
    print(f"Processing task: {payload}")
    try:
        # Step 1: Advanced Reasoning
        reasoning = AxonService.advanced_reasoning(payload)
        print(reasoning)
        
        # Step 2: Simulate execution
        if "error" in payload.lower():
            raise Exception("Simulated execution failure")
            
        return "Task completed successfully with AXON reasoning"
        
    except Exception as e:
        # Step 3: Auto-healing logic
        healing_strategy = AxonService.auto_heal(str(e))
        print(f"Self-healing: {healing_strategy}")
        
        # Retry logic
        raise self.retry(exc=e, countdown=2**self.request.retries)
