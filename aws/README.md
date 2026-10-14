# AWS deployment plan

Infrastructure is not provisioned by this starter. These steps can initially
be performed in the AWS console; deployment scripts or infrastructure as code
can be added once the region, domain, and resource names are agreed on.

## Frontend: S3 + CloudFront

Build `app/` and upload the contents of `app/dist/` to a dedicated frontend
S3 bucket. Keep Block Public Access enabled. Use the bucket's regular S3 origin
with CloudFront Origin Access Control (OAC), granting that distribution read
access via the bucket policy. S3 website hosting is not needed for this setup.
Set CloudFront's default root object to `index.html` and redirect HTTP to HTTPS.

When client-side routes are added, configure a CloudFront Function to rewrite
extensionless frontend routes to `/index.html`. Avoid rewriting asset or API
requests. Invalidate updated frontend files when deploying.

Set `VITE_API_URL` to the public HTTPS API URL before building; Vite embeds it
at build time. Browser environment variables must never contain secrets.

## Backend: EC2

Run the API container on EC2, behind an HTTPS reverse proxy such as Caddy or
Nginx. The HTTPS frontend needs an HTTPS API endpoint. Set `DATABASE_URL` for
RDS and `CORS_ORIGINS` to a JSON array containing the actual frontend origin.
Allow required API methods as features are added. Use an instance IAM role
for AWS access instead of static access keys.

## Database: RDS PostgreSQL

Use a private RDS instance reachable from EC2. Its security group should allow
port 5432 from the backend's security group. Store production credentials in
Secrets Manager or SSM Parameter Store and use TLS for database connections.
Apply the same future versioned migrations used in local development.

## Pet images: separate S3 bucket

Keep uploaded pet images separate from frontend build files. Use backend-issued
presigned upload URLs and scoped IAM permissions. Decide how images will be
served when implementing pet profiles (for example, CloudFront for public
adoption photos). Configure upload CORS for the frontend origin at that point.

## Monitoring: CloudWatch

Backend: collect API access/error logs with the CloudWatch Agent on EC2 and
configure log retention and alarms. EC2 metrics alone do not collect application
exceptions; container logs need an explicit collection configuration.

Frontend: create a CloudWatch RUM app monitor and install/configure its browser
client to capture JavaScript errors and failed requests. Hosting in S3 does
not automatically collect browser errors. RUM is not integrated in this starter;
it needs the monitor's region, identity configuration, and app monitor ID.

## References

- [CloudFront access to private S3 origins](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [CloudWatch RUM setup](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-RUM-get-started.html)
