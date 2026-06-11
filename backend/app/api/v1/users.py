from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user, RoleChecker
from app.models.user import User
from app.schemas.user import UserOut, UserCreate, UserUpdate
from app.crud import crud_user

router = APIRouter()

@router.get("", response_model=List[UserOut])
def read_institute_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    admin_check: User = Depends(RoleChecker(["admin"]))
):
    return crud_user.get_all_users(db)

@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_institute_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    admin_check: User = Depends(RoleChecker(["admin"]))
):
    existing = crud_user.get_user_by_email(db, email=payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )
    return crud_user.create_user(db, obj_in=payload)

@router.put("/{user_id}", response_model=UserOut)
def update_institute_user(
    user_id: str,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    admin_check: User = Depends(RoleChecker(["admin"]))
):
    user = crud_user.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud_user.update_user(db, db_obj=user, obj_in=payload)
