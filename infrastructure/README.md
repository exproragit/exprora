# Infrastructure as Code

Enterprise-grade infrastructure setup using Terraform.

## Structure

```
infrastructure/
├── terraform/
│   ├── main.tf              # Main configuration
│   ├── variables.tf         # Variable definitions
│   ├── outputs.tf           # Output values
│   ├── terraform.tfvars     # Variable values (not in git)
│   └── modules/
│       ├── vpc/             # VPC module
│       ├── rds/             # RDS module
│       ├── ecs/             # ECS module
│       ├── cloudfront/      # CloudFront module
│       └── waf/             # WAF module
└── README.md
```

## Usage

### Initial Setup

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Review plan
terraform plan

# Apply (creates infrastructure)
terraform apply
```

### Environment-Specific

```bash
# Production
terraform workspace select production
terraform apply -var-file=production.tfvars

# Staging
terraform workspace select staging
terraform apply -var-file=staging.tfvars
```

## State Management

- State stored in S3 (backend)
- State locking with DynamoDB
- Never commit `.tfvars` files
- Use separate state files per environment

## Cost Estimation

```bash
terraform plan -out=tfplan
terraform show -json tfplan | terraform-cost-estimation
```

## Security

- All secrets in AWS Secrets Manager
- No secrets in Terraform state
- Use IAM roles, not access keys
- Enable state encryption

