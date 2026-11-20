"""Create an organization and its first organization-member login.

Run from api/: python -m scripts.create_organization
The password is prompted without echoing and stored as an Argon2 hash.
"""
from getpass import getpass
import sys

from pydantic import EmailStr, TypeAdapter
from pwdlib import PasswordHash

from petcloud.config import get_settings
import psycopg
from psycopg.rows import dict_row


def main() -> None:
    name = input("Organization name: ").strip()
    email = str(TypeAdapter(EmailStr).validate_python(input("Login email: ").strip()))
    full_name = input("Member full name: ").strip()
    city = input("City: ").strip()
    state = input("State: ").strip()
    country = input("Country [Brazil]: ").strip() or "Brazil"
    password = getpass("Temporary password (minimum 8 characters): ")
    if len(password) < 8:
        raise SystemExit("Password must contain at least 8 characters.")
    confirmation = getpass("Confirm password: ")
    if password != confirmation:
        raise SystemExit("Passwords do not match.")

    with psycopg.connect(get_settings().database_url, row_factory=dict_row) as conn:
        organization = conn.execute(
            """INSERT INTO organizations(name,email,city,state,country)
               VALUES (%s,%s,%s,%s,%s) RETURNING id""",
            (name, email, city, state, country),
        ).fetchone()
        user = conn.execute(
            """INSERT INTO users(email,password_hash,full_name,role,organization_id,city,state)
               VALUES (%s,%s,%s,'organization_member',%s,%s,%s) RETURNING id""",
            (email, PasswordHash.recommended().hash(password), full_name, organization["id"], city, state),
        ).fetchone()
    print(f"Organization created: {organization['id']}")
    print(f"Organization user created: {user['id']} ({email})")


if __name__ == "__main__":
    main()
