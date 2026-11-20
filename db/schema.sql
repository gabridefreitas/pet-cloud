CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS organizations (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 name TEXT NOT NULL, description TEXT, email TEXT NOT NULL UNIQUE, phone TEXT, address TEXT,
 city TEXT NOT NULL, state TEXT NOT NULL, country TEXT NOT NULL DEFAULT 'Brazil',
 logo_key TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS users (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, full_name TEXT NOT NULL,
 phone TEXT, role TEXT NOT NULL CHECK (role IN ('adopter','organization_member')),
 organization_id UUID REFERENCES organizations(id), city TEXT, state TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK ((role = 'organization_member' AND organization_id IS NOT NULL) OR role = 'adopter')
);
CREATE TABLE IF NOT EXISTS pets (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id),
 name TEXT NOT NULL, species TEXT NOT NULL CHECK (species IN ('cat','dog')), breed TEXT NOT NULL,
 sex TEXT NOT NULL CHECK (sex IN ('male','female')), age_months INTEGER NOT NULL CHECK (age_months >= 1),
 size TEXT NOT NULL CHECK (size IN ('small','medium','large')),
 color TEXT NOT NULL CHECK (color IN ('golden','brown','gray','black','red','bicolor','brindle')),
 description TEXT NOT NULL, health_notes TEXT, is_vaccinated BOOLEAN NOT NULL DEFAULT false,
 is_neutered BOOLEAN NOT NULL DEFAULT false,
 status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','pending','adopted','unavailable')),
 city TEXT NOT NULL, state TEXT NOT NULL, country TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS pet_photos (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
 s3_key TEXT NOT NULL UNIQUE, is_primary BOOLEAN NOT NULL DEFAULT false, position INTEGER NOT NULL DEFAULT 0,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS adoption_requests (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), pet_id UUID NOT NULL REFERENCES pets(id),
 adopter_id UUID NOT NULL REFERENCES users(id), organization_id UUID NOT NULL REFERENCES organizations(id),
 status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
 message TEXT NOT NULL, housing_type TEXT NOT NULL CHECK (housing_type IN ('house','apartment','other')),
 has_children BOOLEAN NOT NULL DEFAULT false, has_other_pets BOOLEAN NOT NULL DEFAULT false,
 review_note TEXT, reviewed_by UUID REFERENCES users(id), reviewed_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_pets_catalog ON pets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_pets_org ON pets(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_requests_adopter ON adoption_requests(adopter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_requests_org ON adoption_requests(organization_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_open_adoption_request ON adoption_requests(pet_id, adopter_id) WHERE status='pending';
