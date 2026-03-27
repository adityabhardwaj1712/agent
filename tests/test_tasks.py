import pytest
from httpx import AsyncClient

def test_health(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "running"

def test_list_tasks(client):
    response = client.get("/api/v1/tasks/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_create_task(client):
    response = client.post("/api/v1/tasks/run", json={
        "description": "Test Task",
        "agent_name": "TestAgent"
    })
    assert response.status_code == 200
    data = response.json()
    assert "task_id" in data
    assert data["status"] == "Task started"

def test_invalid_task(client):
    # Missing required field
    response = client.post("/api/v1/tasks/run", json={})
    assert response.status_code == 422 
