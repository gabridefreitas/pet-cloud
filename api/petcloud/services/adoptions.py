import psycopg
from fastapi import HTTPException
from petcloud.services.database import connect
from petcloud.services.common import adoption_details

def create_request(data,user):
    with connect() as conn:
        pet=conn.execute('SELECT * FROM pets WHERE id=%s',(data.pet_id,)).fetchone()
        if not pet: raise HTTPException(404,'Pet not found.')
        if pet['status']!='available': raise HTTPException(409,f"{pet['name']} is no longer available for adoption.")
        try:
            return conn.execute('''INSERT INTO adoption_requests(pet_id,adopter_id,organization_id,message,housing_type,has_children,has_other_pets)
            VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING *''',(data.pet_id,user['id'],pet['organization_id'],data.message,data.housing_type,data.has_children,data.has_other_pets)).fetchone()
        except psycopg.errors.UniqueViolation:
            raise HTTPException(409,f"You already have a pending request for {pet['name']}.") from None
def my_requests(user):
    with connect() as conn:
        rows=conn.execute('SELECT * FROM adoption_requests WHERE adopter_id=%s ORDER BY created_at DESC',(user['id'],)).fetchall()
        return [adoption_details(conn,r) for r in rows]
def organization_requests(user):
    with connect() as conn:
        rows=conn.execute('SELECT * FROM adoption_requests WHERE organization_id=%s ORDER BY created_at DESC',(user['organization_id'],)).fetchall()
        return [adoption_details(conn,r) for r in rows]
def decide_request(request_id,data,user):
    with connect() as conn:
        row=conn.execute('SELECT * FROM adoption_requests WHERE id=%s AND organization_id=%s FOR UPDATE',(request_id,user['organization_id'])).fetchone()
        if not row: raise HTTPException(404,'Adoption request not found.')
        if row['status']!='pending': raise HTTPException(409,'Only pending requests can be reviewed.')
        if data.status=='approved':
            pet=conn.execute('SELECT * FROM pets WHERE id=%s FOR UPDATE',(row['pet_id'],)).fetchone()
            if pet['status']!='available': raise HTTPException(409,'This pet is no longer available.')
            conn.execute("UPDATE pets SET status='pending',updated_at=now() WHERE id=%s",(row['pet_id'],))
        return conn.execute('''UPDATE adoption_requests SET status=%s,review_note=%s,reviewed_by=%s,reviewed_at=now(),updated_at=now() WHERE id=%s RETURNING *''',
            (data.status,(data.review_note or '').strip() or None,user['id'],request_id)).fetchone()
