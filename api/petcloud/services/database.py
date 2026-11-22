import psycopg
from psycopg.rows import dict_row

from petcloud.config import get_settings


def connect():
    return psycopg.connect(get_settings().database_url, row_factory=dict_row)
