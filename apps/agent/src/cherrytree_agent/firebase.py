"""Firebase Admin SDK and validated access to Firestore.

Every document is read through its generated model, so a malformed document fails here instead
of deep inside an agent. Writes are dumped from the same models by alias (camelCase, as the web
app reads them).
"""

from functools import lru_cache

import firebase_admin
from firebase_admin import firestore_async
from google.cloud.firestore import AsyncClient, AsyncDocumentReference, AsyncTransaction
from pydantic import BaseModel

from cherrytree_agent.settings import get_settings


def firebase_app() -> firebase_admin.App:
    """The default Firebase app (Firestore, Auth, App Check), initialized on first use. Every
    Firebase call passes it explicitly, so none depends on another having run first."""
    try:
        return firebase_admin.get_app()
    except ValueError:
        return firebase_admin.initialize_app(
            options={"projectId": get_settings().google_cloud_project}
        )


@lru_cache
def get_db() -> AsyncClient:
    return firestore_async.client(app=firebase_app())


def project_ref(db: AsyncClient, project_id: str) -> AsyncDocumentReference:
    return db.collection("projects").document(project_id)


def advisor_state_ref(db: AsyncClient, project_id: str) -> AsyncDocumentReference:
    return project_ref(db, project_id).collection("advisor").document("state")


def draft_ref(db: AsyncClient, project_id: str) -> AsyncDocumentReference:
    return project_ref(db, project_id).collection("draft").document("current")


def thread_ref(db: AsyncClient, project_id: str, thread_id: str) -> AsyncDocumentReference:
    return project_ref(db, project_id).collection("threads").document(thread_id)


def turn_doc_id(index: int) -> str:
    """Zero-padded, so document ids sort in turn order."""
    return f"{index:05d}"


def turn_ref(db: AsyncClient, project_id: str, index: int) -> AsyncDocumentReference:
    return project_ref(db, project_id).collection("turns").document(turn_doc_id(index))


def transcript_ref(db: AsyncClient, project_id: str, index: int) -> AsyncDocumentReference:
    return project_ref(db, project_id).collection("transcript").document(turn_doc_id(index))


async def read[M: BaseModel](
    ref: AsyncDocumentReference, model: type[M], transaction: AsyncTransaction | None = None
) -> M | None:
    snapshot = await ref.get(transaction=transaction)
    return model.model_validate(snapshot.to_dict()) if snapshot.exists else None


def to_firestore(document: BaseModel) -> dict[str, object]:
    return document.model_dump(by_alias=True)
