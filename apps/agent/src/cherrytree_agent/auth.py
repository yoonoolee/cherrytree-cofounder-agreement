"""Caller verification for every endpoint.

A request must carry a limited-use App Check token, which is consumed so a captured request
cannot be replayed, and a Firebase ID token whose uid is the Clerk user id (the web app signs in
to Firebase with a custom token from `getFirebaseToken`). The caller must then be the project's
`admin`. The project and user an agent works on come only from here, never from model or tool
input.
"""

import asyncio
import logging
from dataclasses import dataclass
from typing import Annotated

from fastapi import Header, HTTPException, status
from firebase_admin import app_check, auth

from cherrytree_agent.contracts.models import Project
from cherrytree_agent.firebase import firebase_app, get_db, project_ref, read

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class Caller:
    uid: str
    project_id: str


def _unauthenticated(detail: str, error: Exception | None = None) -> HTTPException:
    # The cause is logged (never the token) so a rejected caller can be diagnosed.
    logger.warning(detail, exc_info=error, extra={"event": "auth_rejected"})
    return HTTPException(status.HTTP_401_UNAUTHORIZED, detail)


async def _verify_app_check(token: str | None) -> None:
    if not token:
        raise _unauthenticated("Missing App Check token")
    try:
        claims = await asyncio.to_thread(
            app_check.verify_token, token, app=firebase_app(), consume=True
        )
    except Exception as error:
        raise _unauthenticated("Invalid App Check token", error) from error
    if claims.get("already_consumed"):
        raise _unauthenticated("App Check token already used")


async def _verify_id_token(authorization: str | None) -> str:
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise _unauthenticated("Missing Firebase ID token")
    try:
        claims = await asyncio.to_thread(auth.verify_id_token, token, app=firebase_app())
    except Exception as error:
        raise _unauthenticated("Invalid Firebase ID token", error) from error
    return claims["uid"]


async def require_project_admin(
    project_id: str,
    authorization: Annotated[str | None, Header()] = None,
    x_firebase_appcheck: Annotated[str | None, Header()] = None,
) -> Caller:
    """The verified caller, if they are the project's admin. Both tokens are checked before
    anything else is touched. A missing project and a project the caller is not a member of get
    the same answer, so project ids cannot be probed."""
    await _verify_app_check(x_firebase_appcheck)
    uid = await _verify_id_token(authorization)

    project = await read(project_ref(get_db(), project_id), Project)
    member = project.members.get(uid) if project else None
    if member is None or member.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not an admin of this project")
    return Caller(uid=uid, project_id=project_id)
