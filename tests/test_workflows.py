import pytest

def test_list_workflows(client):
    response = client.get("/api/v1/workflows/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_save_workflow(client):
    response = client.post("/api/v1/workflows/", json={
        "name": "Test Workflow",
        "description": "Testing the workflow",
        "definition": {
            "nodes": [],
            "edges": []
        }
    })
    assert response.status_code == 200
    assert response.json() == {"status": "saved"}

def test_get_workflow(client):
    # The workflow was created in the previous test
    response = client.get("/api/v1/workflows/Test Workflow")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Workflow"
    assert data["description"] == "Testing the workflow"
    
def test_get_nonexistent_workflow(client):
    response = client.get("/api/v1/workflows/Unknown Workflow")
    assert response.status_code == 404
