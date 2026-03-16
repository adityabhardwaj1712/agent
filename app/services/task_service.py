from ..schemas.task_schema import TaskCreate
from .orchestrator import orchestrator


def send_task(data: TaskCreate):
    enq = orchestrator.enqueue_task(data.payload)
    return {"task_id": enq.task_id, "agent_id": data.agent_id, "payload": data.payload, "status": "queued"}


def get_task_status(task_id: str):
    status = orchestrator.get_status(task_id)
    return {"task_id": status.task_id, "status": status.status, "result": status.result}
