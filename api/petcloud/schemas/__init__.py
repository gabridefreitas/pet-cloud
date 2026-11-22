
"""Pydantic models implementing the frontend contract in app/src/types/index.ts."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Id = UUID
IsoDateTime = datetime

UserRole = Literal['adopter', 'organization_member']
PetSpecies = Literal['cat', 'dog']
PetSex = Literal['male', 'female']
PetSize = Literal['small', 'medium', 'large']
PetColor = Literal['golden', 'brown', 'gray', 'black', 'red', 'bicolor', 'brindle']
PetStatus = Literal['available', 'pending', 'adopted', 'unavailable']
AdoptionRequestStatus = Literal['pending', 'approved', 'rejected', 'cancelled']
HousingType = Literal['house', 'apartment', 'other']
AgeGroup = Literal['baby', 'young', 'adult', 'senior']


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class User(ORMModel):
    id: Id
    email: EmailStr
    full_name: str
    phone: str | None
    role: UserRole
    organization_id: Id | None
    city: str | None
    state: str | None
    created_at: IsoDateTime
    updated_at: IsoDateTime


class Organization(ORMModel):
    id: Id
    name: str
    description: str | None
    email: EmailStr
    phone: str | None
    address: str | None
    city: str
    state: str
    country: str
    logo_key: str | None
    logo_url: str | None
    created_at: IsoDateTime
    updated_at: IsoDateTime


class PetPhoto(ORMModel):
    id: Id
    pet_id: Id
    s3_key: str
    url: str
    is_primary: bool
    position: int


class Pet(ORMModel):
    id: Id
    organization_id: Id
    name: str
    species: PetSpecies
    breed: str
    sex: PetSex
    age_months: int
    size: PetSize
    color: PetColor
    description: str
    health_notes: str | None
    is_vaccinated: bool
    is_neutered: bool
    status: PetStatus
    city: str
    state: str
    country: str
    photos: list[PetPhoto]
    created_at: IsoDateTime
    updated_at: IsoDateTime


class PetDetails(Pet):
    organization: Organization


class PetInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    species: PetSpecies
    breed: str = Field(min_length=1, max_length=100)
    sex: PetSex
    age_months: int = Field(ge=1, le=600)
    size: PetSize
    color: PetColor
    description: str = Field(min_length=20, max_length=5000)
    health_notes: str | None = None
    is_vaccinated: bool
    is_neutered: bool
    status: PetStatus = 'available'
    city: str
    state: str
    country: str


class PetStatusUpdate(BaseModel):
    status: PetStatus


class AdopterSummary(BaseModel):
    id: Id
    full_name: str
    email: EmailStr
    phone: str | None
    city: str | None
    state: str | None


class AdoptionRequest(BaseModel):
    id: Id
    pet_id: Id
    adopter_id: Id
    organization_id: Id
    status: AdoptionRequestStatus
    message: str
    housing_type: HousingType
    has_children: bool
    has_other_pets: bool
    review_note: str | None
    reviewed_by: Id | None
    reviewed_at: IsoDateTime | None
    created_at: IsoDateTime
    updated_at: IsoDateTime


class AdoptionRequestDetails(AdoptionRequest):
    pet: Pet
    adopter: AdopterSummary


class AdoptionRequestInput(BaseModel):
    pet_id: Id
    message: str = Field(min_length=30, max_length=3000)
    housing_type: HousingType
    has_children: bool
    has_other_pets: bool


class AdoptionRequestDecision(BaseModel):
    status: Literal['approved', 'rejected']
    review_note: str | None = Field(None, max_length=2000)


class Paginated(BaseModel):
    items: list[Pet]
    total: int
    page: int
    page_size: int


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class RegisterInput(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal['bearer'] = 'bearer'


class PhotoUploadRequest(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    content_type: Literal['image/jpeg', 'image/png', 'image/webp']


class PhotoUploadTicket(BaseModel):
    upload_url: str
    s3_key: str
    expires_in: int


class PhotoRegister(BaseModel):
    s3_key: str


class BrowserLog(BaseModel):
    level: Literal['error', 'warning', 'info'] = 'error'
    message: str = Field(min_length=1, max_length=10000)
    source: str | None = None
    stack: str | None = None
    url: str | None = None
    timestamp: datetime | None = None
    context: dict | None = None
