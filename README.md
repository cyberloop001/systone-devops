# Unit Converter Grader

A serverless REST API (+ browser UI) that grades student temperature-conversion responses for science teachers. Built with **Node.js 20**, deployed to **AWS Lambda + API Gateway** via **AWS SAM**, with a full **GitHub Actions** CI/CD pipeline across **dev** and **prod** environments.

---

## Table of Contents

- [Live Environments](#live-environments)
- [Architecture](#architecture)
- [Supported Units](#supported-units)
- [Grading Rules](#grading-rules)
- [Using the API](#using-the-api)
- [Browser UI](#browser-ui)
- [Local Development](#local-development)
- [CI/CD Pipeline](#cicd-pipeline)
- [Cloud Deployment (manual)](#cloud-deployment-manual)
- [Future Improvements](#future-improvements)

---

## Live Environments

| Environment | Branch    | URL |
|-------------|-----------|-----|
| Dev         | `develop` | Set after first deploy — see CloudFormation output `ApiUrl` for stack `unit-converter-dev` |
| Prod        | `main`    | Set after first deploy — see CloudFormation output `ApiUrl` for stack `unit-converter-prod` |

---

## Architecture

```
GitHub PR  ──►  CI workflow (lint + test)
                    │
    push develop ──►  deploy-dev  ──►  AWS Lambda (unit-converter-dev)
                                           │
    push main    ──►  deploy-prod ──►  AWS Lambda (unit-converter-prod)
```

- **Runtime**: AWS Lambda (Node.js 20)
- **API**: Amazon API Gateway HTTP API (v2)
- **IaC**: AWS SAM (`template.yaml` + `samconfig.toml`)
- **CI/CD**: GitHub Actions (3 workflows — `ci`, `deploy-dev`, `deploy-prod`)
- **Two environments**: `dev` (branch `develop`) and `prod` (branch `main`), each with isolated Lambda functions, API Gateways, and S3 artifact buckets.

---

## Supported Units

| Name        | Accepted string (case-insensitive) |
|-------------|-------------------------------------|
| Kelvin      | `kelvin`                            |
| Celsius     | `celsius`                           |
| Fahrenheit  | `fahrenheit`                        |
| Rankine     | `rankine`                           |

---

## Grading Rules

| Condition | Result |
|-----------|--------|
| `inputUnit` or `targetUnit` not in the supported list | `invalid` |
| `inputValue` is not a finite number | `invalid` |
| `studentResponse` is not a parseable finite number | `incorrect` |
| `studentResponse` rounded to tenths ≠ authoritative answer rounded to tenths | `incorrect` |
| `studentResponse` rounded to tenths = authoritative answer rounded to tenths | `correct` |

### Example scenarios

| Input Value | Input Unit | Target Unit | Student Response | Output |
|-------------|-----------|------------|-----------------|--------|
| 84.2 | Fahrenheit | Rankine | 543.94 | **correct** |
| 317.33 | Kelvin | Fahrenheit | 111.554 | **incorrect** |
| 6.5 | Fahrenheit | Rankine | dog | **incorrect** |
| 136.1 | dogcow | Celsius | 45.32 | **invalid** |

---

## Using the API

### `POST /convert`

**Request**

```bash
curl -X POST https://<API_URL>/convert \
  -H "Content-Type: application/json" \
  -d '{
    "inputValue": 84.2,
    "inputUnit": "fahrenheit",
    "targetUnit": "rankine",
    "studentResponse": "543.94"
  }'
```

**Response — correct**

```json
{ "result": "correct", "authoritative": 543.9 }
```

**Response — incorrect**

```json
{ "result": "incorrect", "authoritative": 111.5 }
```

**Response — invalid**

```json
{ "result": "invalid" }
```

#### Request body fields

| Field | Type | Description |
|-------|------|-------------|
| `inputValue` | number | The numerical value to convert |
| `inputUnit` | string | Source unit of measure |
| `targetUnit` | string | Target unit of measure |
| `studentResponse` | string \| number | The student's numeric answer |

---

## Browser UI

Navigate to the root URL (`GET /`) in any browser. A form lets teachers enter the four required fields and instantly see **correct**, **incorrect**, or **invalid** with the authoritative answer shown on incorrect responses.

---

## Local Development

### Prerequisites

- Node.js ≥ 20
- npm

### Install & test

```bash
npm install
npm test          # runs Jest with coverage
npm run lint      # ESLint
```

### Local Lambda emulation (requires AWS SAM CLI)

```bash
sam build
sam local start-api   # serves on http://localhost:3000
```

Open `http://localhost:3000` in a browser, or:

```bash
curl -X POST http://localhost:3000/convert \
  -H "Content-Type: application/json" \
  -d '{"inputValue":84.2,"inputUnit":"fahrenheit","targetUnit":"rankine","studentResponse":"543.94"}'
```

---

## CI/CD Pipeline

Three GitHub Actions workflows handle the full software delivery lifecycle:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | PR to `main` or `develop`, or push to either branch | Lint + full test suite with coverage |
| `deploy-dev.yml` | Push to `develop` | Deploy to the **dev** environment |
| `deploy-prod.yml` | Push to `main` | Deploy to the **prod** environment (with manual approval gate) |

### Required GitHub Secrets

Configure these under **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `AWS_REGION` | e.g. `us-east-1` |
| `AWS_ACCOUNT_ID` | 12-digit AWS account ID (used to name S3 artifact buckets) |

The `prod` environment should have a **required reviewer** configured in **Settings → Environments → prod** to enforce a manual approval gate before production deploys.

### Branch Strategy

```
feature/* ──► develop  (CI runs, auto-deploys to dev)
develop   ──► main     (CI runs, manual approval, auto-deploys to prod)
```

---

## Cloud Deployment (manual)

If you want to deploy without GitHub Actions:

```bash
# Install AWS SAM CLI: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create S3 artifact bucket (first time only)
aws s3api create-bucket \
  --bucket "unit-converter-sam-artifacts-dev-${AWS_ACCOUNT_ID}" \
  --region us-east-1

# Build & deploy to dev
sam build
sam deploy --config-env dev --s3-bucket "unit-converter-sam-artifacts-dev-${AWS_ACCOUNT_ID}"

# Build & deploy to prod
sam deploy --config-env prod --s3-bucket "unit-converter-sam-artifacts-prod-${AWS_ACCOUNT_ID}"
```

The deployed API URL is printed as a CloudFormation output (`ApiUrl`).

---

## Future Improvements

Prioritized list of next development tasks:

1. **Custom domain + HTTPS (Route 53 + ACM)**  
   Map the API Gateway to a human-readable domain (e.g. `api.unit-converter.io`) with a managed TLS certificate, so URLs remain stable across stack redeployments and environments are clearly differentiated (`api-dev.` vs `api.`).

2. **Authentication & API key management (Amazon Cognito or API Gateway usage plans)**  
   Protect the `/convert` endpoint so only authorized teachers (or school systems) can call it, add per-client rate limiting, and provide a simple token-based login for the browser UI.

3. **Expand supported physical quantities (volume, mass, length, speed)**  
   The grader module is designed around a pluggable conversion strategy. Adding new quantity types is a matter of adding a new converter module without touching the routing or grading logic.

4. **Submission persistence & analytics (DynamoDB + reporting endpoint)**  
   Store every grading request (teacher ID, question, student ID, result, timestamp) in DynamoDB. Expose a reporting API so teachers can review per-student and per-class accuracy trends over time.

5. **Observability — structured logging, tracing & alerting (AWS CloudWatch + X-Ray)**  
   Emit structured JSON logs from the Lambda, enable AWS X-Ray active tracing, and create CloudWatch alarms for error rate, P99 latency, and throttle events, with SNS notifications so the on-call engineer is paged automatically.

6. **End-to-end / integration test suite (Playwright or Supertest against a deployed stack)**  
   Add a post-deploy smoke-test step to the CI/CD workflow that runs against the real dev endpoint, catching environment-specific issues (IAM, cold-start timeouts, misconfigured CORS) that unit tests cannot detect.

7. **Dependency vulnerability scanning & SBOM (npm audit + OWASP Dependency-Check in CI)**  
   Block merges when high-severity CVEs are detected in `node_modules` and generate a Software Bill of Materials on every release for compliance requirements.
