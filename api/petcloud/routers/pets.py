from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query, UploadFile

from petcloud.dependencies import OrganizationMember
from petcloud.schemas import (
    AgeGroup,
    Paginated,
    Pet,
    PetColor,
    PetDetails,
    PetInput,
    PetPhoto,
    PetSex,
    PetSize,
    PetSpecies,
    PetStatus,
    PetStatusUpdate,
)
from petcloud.services import pets

router = APIRouter(tags=['Pets'])


@router.get('/pets', response_model=Paginated)
def list_pets(
    species: PetSpecies | None = None,
    location: str | None = None,
    size: Annotated[list[PetSize] | None, Query()] = None,
    breed: Annotated[list[str] | None, Query()] = None,
    color: Annotated[list[PetColor] | None, Query()] = None,
    sex: PetSex | None = None,
    age: Annotated[list[AgeGroup] | None, Query()] = None,
    status: PetStatus = 'available',
    page: int = Query(1, ge=1),
    page_size: int = Query(9, ge=1, le=100)
):
    return pets.list_pets(
        species, location, size, breed, color,
        sex, age, status, page, page_size
    )


@router.get('/pets/{pet_id}', response_model=PetDetails)
def get_pet(pet_id: UUID):
    return pets.get_pet(pet_id)


@router.get('/organizations/me/pets', response_model=list[Pet])
def organization_pets(user: OrganizationMember):
    return pets.organization_pets(user)


@router.post('/pets', response_model=Pet, status_code=201)
def create_pet(
    data: PetInput,
    user: OrganizationMember
):
    return pets.create_pet(data, user)


@router.patch('/pets/{pet_id}', response_model=Pet)
def update_pet(
    pet_id: UUID,
    data: PetStatusUpdate,
    user: OrganizationMember
):
    return pets.update_pet(pet_id, data, user)


@router.post('/pets/{pet_id}/photos', response_model=PetPhoto, status_code=201)
def upload_photo(pet_id: UUID, file: UploadFile, user: OrganizationMember):
    return pets.upload_photo(pet_id, file, user)
