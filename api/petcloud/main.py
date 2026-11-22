from __future__ import annotations

import json
import logging
import sys
import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from petcloud.config import get_settings
from petcloud.routers import adoptions, auth, logs, organization, pets
from petcloud.services.database import connect


class JsonFormatter(logging.Formatter):
    def format(self, record):
        payload={'timestamp':self.formatTime(record),'level':record.levelname,'logger':record.name,'message':record.getMessage()}
        try:
            structured=json.loads(record.getMessage())
            if isinstance(structured,dict): payload.update(structured)
        except (ValueError, TypeError): pass
        if record.exc_info: payload['exception']=self.formatException(record.exc_info)
        return json.dumps(payload,ensure_ascii=False,default=str)

handler=logging.StreamHandler(sys.stdout); handler.setFormatter(JsonFormatter())
root=logging.getLogger(); root.handlers=[handler]; root.setLevel(logging.INFO)
settings=get_settings(); SCHEMA_PATH=Path(__file__).resolve().parents[2] / 'db' / 'schema.sql'
@asynccontextmanager
async def lifespan(_:FastAPI):
    with connect() as conn: conn.execute(SCHEMA_PATH.read_text(encoding='utf-8'))
    logging.getLogger('petcloud').info('database_schema_ready')
    yield

app=FastAPI(title='PetCloud API',version='2.0.0',lifespan=lifespan)
app.add_middleware(CORSMiddleware,allow_origins=settings.cors_origins,allow_credentials=False,
                   allow_methods=['GET','POST','PATCH','PUT','DELETE','OPTIONS'],
                   allow_headers=['Authorization','Content-Type','Accept'])

@app.middleware('http')
async def request_logging(request:Request,call_next):
    started=time.perf_counter(); status=500
    try:
        response=await call_next(request); status=response.status_code; return response
    finally:
        elapsed=round((time.perf_counter()-started)*1000,2)
        logging.getLogger('petcloud.requests').info(json.dumps({'event':'http_request','method':request.method,
            'route':request.url.path,'status':status,'duration_ms':elapsed},ensure_ascii=False))

@app.exception_handler(HTTPException)
async def http_error_handler(_:Request,exc:HTTPException):
    return JSONResponse(status_code=exc.status_code,content={'detail':exc.detail},headers=exc.headers)
@app.exception_handler(RequestValidationError)
async def validation_error_handler(_:Request,exc:RequestValidationError):
    return JSONResponse(status_code=422,content=jsonable_encoder({'detail':exc.errors()}))

@app.exception_handler(Exception)
async def unexpected_error_handler(_:Request,exc:Exception):
    logging.getLogger('petcloud').exception('unhandled_api_error')
    return JSONResponse(status_code=500,content={'detail':'Internal server error.'})

@app.get('/health')
def health(): return {'status':'ok'}
@app.get('/health/ready')
def readiness():
    try:
        with connect() as conn: conn.execute('SELECT 1')
    except Exception:
        logging.getLogger('petcloud').exception('database_readiness_failed')
        raise HTTPException(status_code=503,detail='Database unavailable') from None
    return {'status':'ok','database':'ok'}

app.include_router(auth.router)
app.include_router(pets.router)
app.include_router(adoptions.router)
app.include_router(organization.router)
app.include_router(logs.router)
