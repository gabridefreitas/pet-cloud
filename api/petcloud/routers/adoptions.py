from uuid import UUID

from fastapi import APIRouter

from petcloud.dependencies import Adopter, OrganizationMember
from petcloud.schemas import AdoptionRequest as AdoptionSchema
from petcloud.schemas import AdoptionRequestDecision, AdoptionRequestDetails, AdoptionRequestInput
from petcloud.services import adoptions

router=APIRouter(prefix='/adoption-requests',tags=['Adoption requests'])
@router.post('',response_model=AdoptionSchema,status_code=201)
def create_request(data:AdoptionRequestInput,user:Adopter): return adoptions.create_request(data,user)
@router.get('/me',response_model=list[AdoptionRequestDetails])
def my_requests(user:Adopter): return adoptions.my_requests(user)
@router.patch('/{request_id}',response_model=AdoptionSchema)
def decide_request(request_id:UUID,data:AdoptionRequestDecision,user:OrganizationMember): return adoptions.decide_request(request_id,data,user)
