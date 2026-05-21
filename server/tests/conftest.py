import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "postgresql://natso@localhost:5432/family_medical_test_db"

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Each test create db when test finished it will drop all db"""
    
    Base.metadata.create_all(bind = engine)
    
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        
@pytest.fixture(scope="function", autouse=True)
def override_dependencies(db_session):
    """Override dependencies get_db of FastAPI"""
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass
            
    app.dependency_overrides[get_db] = _override_get_db
    yield
    app.dependency_overrides.clear()