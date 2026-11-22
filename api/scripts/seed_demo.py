"""Populate an empty local database with randomized, fictional adoption data."""

import argparse
import random
from pathlib import Path

from pwdlib import PasswordHash

from petcloud.services.database import connect

DEMO_PASSWORD = 'petcloud123'
SCHEMA_PATH = Path(__file__).resolve().parents[2] / 'db' / 'schema.sql'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--seed', type=int, default=42, help='Random seed for repeatable demo data.')
    args = parser.parse_args()
    rng = random.Random(args.seed)
    password_hash = PasswordHash.recommended().hash(DEMO_PASSWORD)
    with connect() as conn:
        conn.execute(SCHEMA_PATH.read_text(encoding='utf-8'))
        if conn.execute('SELECT EXISTS(SELECT 1 FROM users) AS populated').fetchone()['populated']:
            raise SystemExit('Demo seed skipped: the database already contains users. No data changed.')

        organizations = []
        members = []
        for name, email, member_name, member_email, city in [
            ('Happy Paws Shelter', 'contact@happypaws.example', 'Carlos Silva',
             'carlos@happypaws.example', 'Porto Alegre'),
            ('Second Chance Shelter', 'contact@secondchance.example', 'Julia Costa',
             'julia@secondchance.example', 'Sao Leopoldo'),
        ]:
            org = conn.execute(
                'INSERT INTO organizations(name,email,description,city,state,country) '
                'VALUES (%s,%s,%s,%s,%s,%s) RETURNING *',
                (name, email, 'A fictional shelter for local adoption testing.', city, 'RS', 'Brazil'),
            ).fetchone()
            organizations.append(org)
            member = conn.execute(
                'INSERT INTO users(email,password_hash,full_name,role,organization_id,city,state) '
                "VALUES (%s,%s,%s,'organization_member',%s,%s,'RS') RETURNING *",
                (member_email, password_hash, member_name, org['id'], city),
            ).fetchone()
            members.append(member)

        adopters = []
        for name, email in [
            ('Marina Santos', 'marina@petcloud.example'),
            ('Pedro Lima', 'pedro@petcloud.example'),
            ('Ana Rocha', 'ana@petcloud.example'),
        ]:
            adopters.append(conn.execute(
                'INSERT INTO users(email,password_hash,full_name,role,city,state,phone) '
                "VALUES (%s,%s,%s,'adopter','Porto Alegre','RS','+55 51 0000-0000') RETURNING *",
                (email, password_hash, name),
            ).fetchone())

        names = ['Luna', 'Max', 'Bella', 'Charlie', 'Lucy', 'Milo', 'Daisy', 'Leo',
                 'Nina', 'Oliver', 'Lola', 'Simba', 'Ruby', 'Toby', 'Cleo', 'Oscar',
                 'Maya', 'Finn', 'Poppy', 'Theo', 'Zoe', 'Archie', 'Coco', 'Felix']
        descriptions = [
            'A friendly companion who enjoys calm walks and spending time with people.',
            'An energetic friend who loves games and is looking for a patient, caring family.',
            'A gentle pet who enjoys a quiet routine and a comfortable place to rest.',
        ]
        pets = []
        for index, name in enumerate(names):
            org = organizations[index % 2]
            species = rng.choice(['cat', 'dog'])
            breed = rng.choice(['Mixed Breed', 'Siamese'] if species == 'cat'
                               else ['Mixed Breed', 'Golden Retriever', 'Bulldog'])
            status = ['available', 'pending', 'adopted', 'unavailable'][index % 4] if index >= 16 else 'available'
            pets.append(conn.execute(
                'INSERT INTO pets(organization_id,name,species,breed,sex,age_months,size,color,'
                'description,is_vaccinated,is_neutered,status,city,state,country) '
                'VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *',
                (org['id'], name, species, breed, rng.choice(['male', 'female']),
                 rng.choice([4, 8, 18, 30, 48, 72, 108, 132]),
                 rng.choice(['small', 'medium', 'large']),
                 rng.choice(['golden', 'brown', 'gray', 'black', 'red', 'bicolor', 'brindle']),
                 rng.choice(descriptions), rng.choice([True, False]), rng.choice([True, False]),
                 status, org['city'], 'RS', 'Brazil'),
            ).fetchone())

        # Include every request state and a pending inbox for each organization.
        for index, status in enumerate(['pending', 'pending', 'rejected', 'cancelled', 'approved']):
            pet = pets[index]
            member = members[index % 2]
            reviewed = status in ('approved', 'rejected')
            conn.execute(
                'INSERT INTO adoption_requests(pet_id,adopter_id,organization_id,status,message,'
                'housing_type,has_children,has_other_pets,review_note,reviewed_by,reviewed_at) '
                'VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,CASE WHEN %s THEN now() ELSE NULL END)',
                (pet['id'], adopters[index % len(adopters)]['id'], pet['organization_id'], status,
                 'I have a stable routine and a safe home, and would love to care for this pet.',
                 rng.choice(['house', 'apartment', 'other']), rng.choice([True, False]),
                 rng.choice([True, False]), 'Demo review.' if reviewed else None,
                 member['id'] if reviewed else None, reviewed),
            )
            if status == 'approved':
                conn.execute("UPDATE pets SET status='pending' WHERE id=%s", (pet['id'],))

    print('Created 2 organizations, 5 users, 24 pets and 5 adoption requests.')
    print('Local demo password: petcloud123')
    print('Adopters: marina@petcloud.example, pedro@petcloud.example, ana@petcloud.example')
    print('Organization A: carlos@happypaws.example')
    print('Organization B: julia@secondchance.example')
    print('Pets start without photos. Upload photos through the organization portal with S3 configured.')


if __name__ == '__main__':
    main()
