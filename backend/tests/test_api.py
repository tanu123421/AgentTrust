import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.models.models import Project
from sqlalchemy.pool import StaticPool

# Isolated SQLite in-memory test database with StaticPool
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "AgentTrust"

def test_system_status(client):
    response = client.get("/api/v1/status")
    assert response.status_code == 200
    data = response.json()
    assert data["app_name"] == "AgentTrust"
    assert data["active_test_definitions"] >= 30

def test_project_crud(client):
    # 1. Create Project
    create_res = client.post("/api/v1/projects", json={
        "name": "Test LLM Security Project",
        "description": "Validation project for CI/CD",
        "target_type": "Tool-Augmented Agent"
    })
    assert create_res.status_code == 201
    proj_data = create_res.json()
    project_id = proj_data["id"]
    assert proj_data["name"] == "Test LLM Security Project"

    # 2. Get Project
    get_res = client.get(f"/api/v1/projects/{project_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == project_id

    # 3. List Projects
    list_res = client.get("/api/v1/projects")
    assert list_res.status_code == 200
    assert any(p["id"] == project_id for p in list_res.json())

    # 4. Update Project
    update_res = client.put(f"/api/v1/projects/{project_id}", json={
        "name": "Updated LLM Project"
    })
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Updated LLM Project"

    # 5. Delete Project
    del_res = client.delete(f"/api/v1/projects/{project_id}")
    assert del_res.status_code == 204

    # 6. Verify deleted
    verify_res = client.get(f"/api/v1/projects/{project_id}")
    assert verify_res.status_code == 404

def test_oversized_payload_rejected(client):
    # Tests that inputs exceeding size limit are cleanly rejected
    response = client.post("/api/v1/evaluations/run", json={
        "project_id": "dummy-id",
        "agent_profile_id": "dummy-profile",
        "custom_prompt": "A" * 25000
    })
    assert response.status_code == 413
