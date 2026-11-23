# AWS deployment plan

This is the deferred AWS deployment plan, not a record of deployed controls.
Application code and local execution are implemented; no AWS account inspection,
provisioning or activation is performed by these instructions or local startup.
The [current contract diagram](../README.md#aws-architecture) supplements the
original proposal model. See the [security case study](security-case-study.md)
for implemented, optional and cloud-only control status.

## Frontend: S3 + CloudFront

Build `app/` and upload the contents of `app/dist/` to a dedicated frontend
S3 bucket. Keep Block Public Access enabled. Use the bucket's regular S3 origin
with CloudFront Origin Access Control (OAC), granting that distribution read
access via the bucket policy. S3 website hosting is not needed for this setup.
Set CloudFront's default root object to `index.html` and redirect HTTP to HTTPS.

The frontend already has client-side routes. Configure a CloudFront Function to rewrite
extensionless frontend routes to `/index.html`. Avoid rewriting asset or API
requests. Invalidate updated frontend files when deploying.

Set `VITE_API_URL` to the public HTTPS API URL before building; Vite embeds it
at build time. Browser environment variables must never contain secrets.

## Backend: EC2

Run the API container on EC2, behind an HTTPS reverse proxy such as Caddy or
Nginx. The HTTPS frontend needs an HTTPS API endpoint. Set `DATABASE_URL` for
RDS and `CORS_ORIGINS` to a JSON array containing the actual frontend origin.
Preserve the API's implemented CORS methods and configured origins. Use an instance IAM role
for AWS access instead of static access keys.

## Database: RDS PostgreSQL

Use a private RDS instance reachable from EC2. Its security group should allow
port 5432 from the backend's security group. Store production credentials in
Secrets Manager or SSM Parameter Store and use TLS for database connections.
The current application uses `db/schema.sql` as its single initial schema, with
no migration tooling. Database deployment/change procedures remain separate
work; do not reset an existing database or assume migrations already exist.

## Pet images: separate S3 bucket

Keep uploaded pet images separate from frontend build files. The browser sends
multipart files to the authenticated API, which validates ownership/content,
uploads to S3 and stores the permanent object key in PostgreSQL. Use scoped IAM
permissions for the API identity. The API returns signed GET image URLs for the
browser to render; no browser-to-S3 PUT or upload CORS configuration is needed.

## Monitoring: CloudWatch

Backend: API JSON events already go to stdout/stderr. Configure Docker's
`awslogs` driver on EC2, the log group/retention and an instance role allowed to
write to it. Keep this driver out of local Compose: it requires AWS configuration
and can prevent container startup when unavailable. No CloudWatch SDK is needed
inside the API. Driver, IAM and log-group configuration remain deployment work.

Frontend: the optional `aws-rum-web` integration captures browser/React errors
and failed API requests. Create a RUM monitor with scoped Cognito/IAM access,
then set the public `VITE_RUM_*` build variables documented in `app/README.md`.
It defaults to disabled, stays off for missing/invalid settings, and is forced off
by the local Compose overlay. S3/CloudFront hosting does not capture React errors.

Infrastructure: enable the required EC2, RDS and CloudFront CloudWatch metrics,
then configure dashboards/alarms. Extra metrics or OS logs may require an agent;
standard service metrics do not replace API application logs or browser RUM.
CloudTrail records AWS account/API activity separately. No AWS resources or
monitoring services are activated by this implementation.

## References

- [CloudFront access to private S3 origins](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [CloudWatch RUM setup](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-RUM-get-started.html)
