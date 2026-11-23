from fastapi import APIRouter

from petcloud.dependencies import OrganizationMember
from petcloud.schemas import AdoptionRequestDetails
from petcloud.services.adoptions import organization_requests

router=APIRouter(prefix='/organizations/me',tags=['Organizations'])
@router.get('/adoption-requests',response_model=list[AdoptionRequestDetails])
def list_adoption_requests(user:OrganizationMember): return organization_requests(user)
