from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.models import Project, AgentProfile
from app.schemas.schemas import ProjectCreate, ProjectUpdate, AgentProfileCreate, AgentProfileUpdate

class ProjectService:
    @staticmethod
    def get_projects(db: Session) -> List[Project]:
        return db.query(Project).order_by(Project.created_at.desc()).all()

    @staticmethod
    def get_project_by_id(db: Session, project_id: str) -> Optional[Project]:
        return db.query(Project).filter(Project.id == project_id).first()

    @staticmethod
    def create_project(db: Session, project_in: ProjectCreate) -> Project:
        project = Project(
            name=project_in.name,
            description=project_in.description,
            target_type=project_in.target_type
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def update_project(db: Session, project_id: str, project_in: ProjectUpdate) -> Optional[Project]:
        project = ProjectService.get_project_by_id(db, project_id)
        if not project:
            return None
        
        if project_in.name is not None:
            project.name = project_in.name
        if project_in.description is not None:
            project.description = project_in.description
        if project_in.target_type is not None:
            project.target_type = project_in.target_type
            
        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def delete_project(db: Session, project_id: str) -> bool:
        project = ProjectService.get_project_by_id(db, project_id)
        if not project:
            return False
        db.delete(project)
        db.commit()
        return True

    # ---------------- Agent Profile Service ----------------
    @staticmethod
    def get_profiles_by_project(db: Session, project_id: str) -> List[AgentProfile]:
        return db.query(AgentProfile).filter(AgentProfile.project_id == project_id).all()

    @staticmethod
    def get_profile_by_id(db: Session, profile_id: str) -> Optional[AgentProfile]:
        return db.query(AgentProfile).filter(AgentProfile.id == profile_id).first()

    @staticmethod
    def create_agent_profile(db: Session, profile_in: AgentProfileCreate) -> AgentProfile:
        tools_dict = [t.model_dump() if hasattr(t, "model_dump") else t for t in profile_in.tools_config]
        profile = AgentProfile(
            project_id=profile_in.project_id,
            name=profile_in.name,
            description=profile_in.description,
            model_provider=profile_in.model_provider,
            sensitivity_level=profile_in.sensitivity_level,
            system_prompt_marker=profile_in.system_prompt_marker,
            tools_config=tools_dict,
            evaluation_notes=profile_in.evaluation_notes
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile

    @staticmethod
    def update_agent_profile(db: Session, profile_id: str, profile_in: AgentProfileUpdate) -> Optional[AgentProfile]:
        profile = ProjectService.get_profile_by_id(db, profile_id)
        if not profile:
            return None

        if profile_in.name is not None:
            profile.name = profile_in.name
        if profile_in.description is not None:
            profile.description = profile_in.description
        if profile_in.model_provider is not None:
            profile.model_provider = profile_in.model_provider
        if profile_in.sensitivity_level is not None:
            profile.sensitivity_level = profile_in.sensitivity_level
        if profile_in.system_prompt_marker is not None:
            profile.system_prompt_marker = profile_in.system_prompt_marker
        if profile_in.tools_config is not None:
            profile.tools_config = [t.model_dump() if hasattr(t, "model_dump") else t for t in profile_in.tools_config]
        if profile_in.evaluation_notes is not None:
            profile.evaluation_notes = profile_in.evaluation_notes

        db.commit()
        db.refresh(profile)
        return profile

    @staticmethod
    def delete_agent_profile(db: Session, profile_id: str) -> bool:
        profile = ProjectService.get_profile_by_id(db, profile_id)
        if not profile:
            return False
        db.delete(profile)
        db.commit()
        return True
