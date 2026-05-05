import pytest

def test_list_workflows(client):
    response = client.get("/v1/workflows/")
    assert response.status_code == 200

def test_save_workflow(client):
    response = client.post("/v1/workflows/", json={
        "name": "Test Workflow",
        "description": "Testing the workflow",
        "definition": {
            "nodes": [],
            "edges": []
        }
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "saved"
    assert "id" in data
    assert data["name"] == "Test Workflow"

def test_get_workflow(client):
    # First create a workflow, then retrieve it by ID
    create_resp = client.post("/v1/workflows/", json={
        "name": "Retrieve Test WF",
        "description": "For get test",
        "definition": {"nodes": [], "edges": []}
    })
    assert create_resp.status_code == 200
    wf_id = create_resp.json()["id"]
    
    response = client.get(f"/v1/workflows/{wf_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Retrieve Test WF"

def test_get_nonexistent_workflow(client):
    response = client.get("/v1/workflows/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404
