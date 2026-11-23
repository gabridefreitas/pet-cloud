# PetCloud Security Case Study

## IAM - Identity and access management

Only PetCloud project members will have direct access to AWS. Each developer will use an individual IAM identity with multi-factor authentication and least-privilege permissions. Developers will use personal access keys for the AWS CLI, kept in local credentials profiles, rotated regularly, and never shared or committed. The API will use an EC2 instance role, while database credentials will be stored in AWS Secrets Manager.

Users won’t have AWS accounts or credentials. They should register and sign in using PetCloud accounts stored in RDS. The React website will send authenticated HTTPS/JSON requests to the API, which will verify the user's session or token and authorize each action using the account role and record ownership. The API validates pet and adoption submissions and reads or writes records in RDS. It also handles image access in S3; the browser communicates with the API, not directly with RDS or S3. Access defaults to denied, with separate permissions for adopters, organization staff, and administrators.

## Monitoring and accountability

Resource usage will be continuously monitored to ensure system stability, security, and cost-efficiency. AWS CloudTrail will record AWS account and resource activity. Amazon CloudWatch will collect browser and API system logs, monitor EC2 and RDS health, and raise alarms for errors or unusual activity. Because the PetCloud backend is designed as a lightweight system running on a t2.micro EC2 instance, monitoring CPU utilization, network traffic, and RDS connections is critical to prevent resource exhaustion and denial of service. Logs will record failed sign-ins and denied requests without storing passwords, tokens, or unnecessary personal data.

## Data protection and security services

All public traffic will use HTTPS with TLS. CloudFront will redirect HTTP to HTTPS, the API will use an HTTPS reverse proxy, and EC2-to-RDS connections will use PostgreSQL TLS. We will encrypt RDS data and backups, EC2 volumes, and S3 buckets at rest with AWS KMS. RDS will remain private and accept connections only from the API security group. S3 Block Public Access and CloudFront Origin Access Control will protect the frontend files; the API's EC2 role will provide scoped access to the separate image bucket. We will limit collected personal data and apply retention and deletion rules.

Together, IAM, CloudTrail, CloudWatch and RUM, AWS Budgets, KMS, Secrets Manager, security groups, and private S3 access provide identity controls, auditability, monitoring, and layered data protection for PetCloud's CloudFront, S3, EC2, and RDS architecture. PetCloud accounts and application login will be managed by the API and stored in RDS; AWS IAM remains restricted to project developers and the API's EC2 role. These are the team's defined security controls; application authentication, AWS infrastructure, and monitoring are not yet implemented in the starter project.
