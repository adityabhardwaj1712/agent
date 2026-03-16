from prometheus_client import Counter, Histogram


REQUESTS_TOTAL = Counter(
    "agentcloud_requests_total",
    "Total HTTP requests",
    ["method", "path", "status"],
)

REQUEST_LATENCY_SECONDS = Histogram(
    "agentcloud_request_latency_seconds",
    "HTTP request latency in seconds",
    ["method", "path"],
)

TASKS_SUBMITTED_TOTAL = Counter(
    "agentcloud_tasks_submitted_total",
    "Tasks submitted",
)
TASK_STATUS_TOTAL = Counter(
    "agentcloud_task_status_total",
    "Task status observations",
    ["status"],
)

MEMORY_WRITES_TOTAL = Counter("agentcloud_memory_writes_total", "Memory writes")
MEMORY_SEARCHES_TOTAL = Counter("agentcloud_memory_searches_total", "Memory searches")

PROTOCOL_SEND_TOTAL = Counter("agentcloud_protocol_send_total", "Protocol messages sent")

