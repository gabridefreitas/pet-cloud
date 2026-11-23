# PetCloud Security Case Study

## Scope and delivery status

The Grade A coding scope is the adopter journey. Organization accounts, their
operational portal and photo uploads are implemented **Extra** functionality;
this classification does not weaken their authorization requirements. See the
[root scope and contract diagram](../README.md#academic-scope-and-implemented-extras)
and [assisted provisioning](../db/README.md#assisted-organization-provisioning-extra).
The original academic PDF/model remain proposal sources, not deployment evidence.

| Control | Current application/local state | Deferred AWS responsibility |
| --- | --- | --- |
| PetCloud identity and authorization | Adopter signup, JWT login, Argon2 password hashes, role and record-ownership checks implemented; organization accounts provisioned by trusted team operators. | Deploy the API/database and validate the same checks there. |
| Image access | API-mediated upload and signed GET URL generation implemented; local Compose disables S3 and photo fields are optional. | Private photo bucket, scoped API role and real upload/display validation. |
| Browser monitoring | Optional CloudWatch RUM client implemented; disabled by default, with incomplete/invalid configuration and in local Compose. | RUM monitor, scoped Cognito/IAM identity and activation/delivery evidence. |
| API monitoring | Structured request, failed-sign-in, denied-access and error events go to stdout/stderr locally. | Docker `awslogs`, EC2 role permissions, log destination and retention. |
| Resource monitoring and audit | No account-level activation or validation performed by local startup. | EC2/RDS/CloudFront metrics, dashboards/alarms, CloudTrail and the planned AWS Budgets control. |
| Network, storage and secret protection | Runtime API settings and public frontend build settings are separate; no cloud secret lookup is required locally. | HTTPS, RDS TLS/private access, KMS encryption, IAM/MFA and Secrets Manager delivery. |

## IAM - Identity and access management

PetCloud users register and sign in with application accounts. The implemented
roles are `adopter` and `organization_member`; there is no global application
administrator. Public signup creates adopters only. Organizations contact the
PetCloud team for assisted creation of the organization and its first member
through the existing trusted backend command, not a public signup endpoint.
The schema supports multiple members sharing one organization's queue; additional
member-management tooling is outside the required scope.

The API validates JWTs, roles and record ownership for protected actions. A member
can manage only their own organization's pets and requests; an adopter sees their
own request history. Catalog browsing is public. New pets belong to the authenticated member's
organization; requests link the authenticated adopter and the selected pet's
organization. Clients cannot assign a different organization. Invalid or
missing authentication returns 401, role mismatch returns 403 and inaccessible
organization resources return 404. Request decisions use row locks and accept
only pending requests, preventing duplicate resolutions.

Application users do not need AWS accounts or permanent AWS access keys. Planned
AWS access is restricted to individual project developer identities with MFA and
least privilege, and to the API's EC2 instance role. Any authorized developer CLI
credentials stay in external local profiles, never shared or committed. These IAM
controls require verification in the AWS phase. The API accepts database/signing
secrets at runtime; the planned Secrets Manager delivery is infrastructure work,
not an application SDK lookup. Frontend `VITE_*` values are public build inputs
and must never contain API signing secrets, database passwords or AWS access keys.
When RUM is later enabled, its public monitor/pool configuration allows the SDK
to obtain scoped temporary credentials; it does not create PetCloud user AWS accounts.

## Data paths and image authorization

The deployment target serves React assets through S3/CloudFront, runs the API on
EC2 and stores application data in RDS PostgreSQL. Local execution uses Docker
services instead. Only the backend application and trusted provisioning commands
connect to PostgreSQL; the browser sends application requests to the API.

For photo upload, the browser sends authenticated multipart data to the API. The
API checks organization ownership, content/type/size and photo limits, writes the
object to the private S3 bucket and stores its permanent key in `pet_photos.s3_key`.
It generates expiring signed GET URLs in the returned `photos[].url`. The browser
renders the URL and downloads the image bytes directly from S3; read bytes are
not proxied through the API. There is no browser-to-S3 upload ticket/PUT flow.
No browser-upload CORS setup is needed for this implemented path.

A signed URL grants bearer read access until expiry (currently one hour), even
without a PetCloud login; it must not be treated as a permanent public asset URL.
The database stores object keys, not image bytes or expiring signed URLs. Local
Compose forces the photo bucket empty: browsing works with placeholders, and
upload is unavailable without storage configuration. The actual private bucket,
scoped role and real signed-image access still need AWS validation.

## Monitoring and accountability

The collection paths are separate and have different activation requirements:

| Source | Collection path | Status |
| --- | --- | --- |
| React/browser | Optional `aws-rum-web` client directly to CloudWatch RUM | Code implemented; disabled locally. No frontend-to-API `/logs` relay. |
| API container | Python JSON events to stdout/stderr, then Docker `awslogs` to CloudWatch Logs | Local events implemented; cloud driver and permissions deferred. |
| EC2, RDS and CloudFront | Service metrics to CloudWatch Metrics and dashboards/alarms | Cloud configuration and evidence deferred. |
| AWS account/resource activity | CloudTrail | Cloud audit configuration/evidence deferred; distinct from PetCloud sign-ins. |

API events identify failed sign-ins, denied actions, HTTP status/duration and
unexpected errors without submitted passwords, tokens, query strings, request
bodies or raw exception messages. Exception type and code locations remain for
diagnosis. Browser reporting covers React/handled/global errors and API HTTP/network
failures, suppresses duplicate reports of the same error object and strips arbitrary
error messages, query/fragment values and UUID path values from remote reports.
Local browser console logs remain available. Automatic page-view, HTTP/resource,
session replay collection and cookies are disabled in this integration.

`VITE_RUM_ENABLED=true` plus complete, format-valid monitor/region/identity settings
is required before loading the RUM SDK. The local overlay forces it off; SDK
initialization/reporting failures do not interrupt application actions. API logs
need no Python CloudWatch SDK. Docker `awslogs` must be configured separately in
the AWS phase, not enabled for the local stack. Native infrastructure metrics do
not replace API events or browser errors. The planned CPU/network/RDS-connection
observations and alarms support the proposed small-instance target (t2.micro);
capacity suitability has not been demonstrated by local startup alone.

## Data protection and deferred controls

Local host access is restricted to loopback for frontend/API; PostgreSQL is not
published by the local overlay. Local HTTP and non-TLS Docker database connections
are development settings. This is not evidence of cloud network isolation.

The agreed AWS target remains HTTPS for public frontend/API traffic, CloudFront
HTTP-to-HTTPS redirection, an HTTPS API reverse proxy, and PostgreSQL TLS between
EC2 and RDS. RDS must remain private and accept backend access only. Planned
at-rest encryption covers RDS data/backups, EC2 volumes and S3 using KMS. Frontend
S3 access uses Block Public Access and CloudFront OAC; the separate photo bucket
uses scoped backend permissions and expiring read URLs. These settings, certificate
mounts and TLS handshakes remain unverified cloud work. The API already accepts
PostgreSQL TLS URI options and runtime-injected secrets; no AWS keys are needed
for the local demo.

The data-minimization commitment is supported by bounded telemetry fields and
omitting submitted credentials and payloads from application telemetry. Production
log retention and storage/backup lifecycle/deletion rules remain cloud policy
work, to be selected and verified before claiming those controls are delivered.
There is no implemented account deletion/anonymization or automatic application
record-retention workflow, and this documentation does not add one to Grade A.
The AWS Budgets reference is likewise a planned cloud control, not an activated
budget or an application feature. Do not claim IAM/MFA, CloudTrail, alarms,
retention, encryption or secret delivery are deployed without corresponding evidence.
