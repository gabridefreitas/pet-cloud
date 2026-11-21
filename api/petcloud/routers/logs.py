import json, logging
from datetime import datetime, timezone
from fastapi import APIRouter, Request
from petcloud.schemas import BrowserLog
router=APIRouter(tags=['Client logs'])
logger=logging.getLogger('petcloud.browser')
@router.post('/logs',status_code=202)
def receive_browser_log(data:BrowserLog,request:Request):
    record={'event':'browser_error','received_at':datetime.now(timezone.utc).isoformat(),'client':data.model_dump(mode='json'),'client_ip':request.client.host if request.client else None}
    logger.error(json.dumps(record,ensure_ascii=False))
    return {'accepted':True}
