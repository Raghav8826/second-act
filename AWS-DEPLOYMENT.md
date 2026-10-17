# SecondAct on AWS

Live website: https://secondact.pages.dev/

The free Cloudflare Pages frontend forwards API calls to the existing AWS backend. Deployment instructions and Cloudflare limits: [deploy/cloudflare/README.md](deploy/cloudflare/README.md).

AWS fallback: https://ctd2zkolmsdn6rk7lgqys56f2i0yenqx.lambda-url.ap-south-1.on.aws/

Deployed 17 October 2026 in Mumbai (`ap-south-1`). The site works independently of the local preview and the participant's computer.

## Services

- **AWS Lambda** `secondact`: serves the existing frontend and backend together through an AWS-provided HTTPS Function URL. Node.js 22, ARM64, 512 MB, 170-second timeout, no provisioned concurrency, no VPC/NAT gateway.
- **DynamoDB** `secondact-usage`: on-demand counters for up to 30 planning attempts per UTC day across all visitors, and four per IP per minute. IPs are hashed before storage. Counter items expire after three days; background TTL deletion can take longer. Maximum on-demand reads and writes are each limited to five request units per second.
- **CloudWatch Logs** `/aws/lambda/secondact`: seven-day retention. Application code does not log briefs, model responses or secret values.
- **Existing Gemini and FalkorDB accounts**: remain external services. Their credentials are private Lambda environment settings and are not in the deployment ZIP or public files. Their own quotas, plan terms and availability still apply.

There are no EC2 instances, paid public IPs, EBS volumes, NAT gateways, load balancers, API Gateway instances, or CloudFront distributions for this deployment. No custom domain was purchased. The AWS account was not upgraded to a paid plan.

## Budget

This setup avoids the fixed monthly cost of an always-on server. At very light traffic, Lambda usage is expected to fit its monthly free allowance of one million requests and 400,000 GB-seconds, subject to account-wide usage and current AWS terms. DynamoDB, storage, logs and internet transfer can add small charges. This is an estimate, not a hard AWS spending cap.

The AWS console showed $100 in credits and a free-account-plan end date of 17 April 2027 during setup. Free-plan expiry or depleted credits can stop service. Keeping AWS running after free-plan expiry requires reviewing the account plan; paid-plan usage beyond allowances or credits can be billed. Do not assume hosting or the external providers will stay free forever.

The 30-attempt daily AI limit is an application usage limit, not a Gemini dollar-spending cap. Failed planning attempts also count. Manual resource search remains available when the planning limit is reached. Resource checks never reserve inventory.

Official pricing and account rules:
- https://aws.amazon.com/lambda/pricing/
- https://aws.amazon.com/dynamodb/pricing/on-demand/
- https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier-plans.html

## Verification

All 30 deterministic backend checks passed, covering the existing graph/planner behavior and the Lambda adapter, blocked private files, validation, shared usage limiting, and connection cleanup.

Public preflight passed for the served frontend assets, all four inventory searches, a live graph health response with 35 resources, and blocked private paths.

A real public fashion plan completed in 11 seconds. The graph selected hand-sewn peacock appliqué with teal offcuts, embroidery floss, fabric scissors and a hand-sewing kit. Verified shared resource cost: ₹105. Gemini output can vary; this is verification evidence, not a fixed response.

## Maintenance

The Lambda entry point is `backend/lambda-handler.handler`. The normal `backend/server.mjs` remains the local preview entry point. Both use the same graph search and creative-planning modules. Frontend behavior was not rewritten for hosting.

Keep `backend/.env`, AWS sign-in caches, private deployment configuration, passwords and API keys out of Git. Lambda environment settings are configured separately from code. Never upload an entire Desktop/project folder containing private files, video recordings, or credentials.

To update the daily cap, change the Lambda environment variable `PLAN_DAILY_LIMIT`. To disable all public access immediately, delete the Lambda Function URL in AWS; deleting it cannot preserve the same URL on recreation. Deleting the function, counter table and log group removes the hosted deployment, so review before deleting.

To check the public deployment from the backend folder, set `SECOND_ACT_URL` to the live URL and run `node check-demo.mjs`. AI checks consume the Gemini quota and daily plan limit; avoid repeatedly generating plans just to monitor uptime.
