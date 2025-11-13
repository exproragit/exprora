# Terraform Configuration for Exprora Enterprise Infrastructure
# This is a template - customize for your needs

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "exprora-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = "Exprora"
      ManagedBy   = "Terraform"
    }
  }
}

# VPC
module "vpc" {
  source = "./modules/vpc"
  
  environment = var.environment
  vpc_cidr    = "10.0.0.0/16"
  
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
  
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
  database_subnet_cidrs = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]
}

# RDS PostgreSQL
module "rds" {
  source = "./modules/rds"
  
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  subnet_ids            = module.vpc.database_subnet_ids
  security_group_ids    = [module.vpc.database_security_group_id]
  
  instance_class        = "db.r6g.xlarge"
  allocated_storage     = 500
  max_allocated_storage = 1000
  engine_version        = "15.4"
  
  backup_retention_period = 35
  multi_az                = true
  
  master_username = "exprora_admin"
  # Password from AWS Secrets Manager
  
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  performance_insights_enabled    = true
  monitoring_interval             = 60
  
  deletion_protection = true
  skip_final_snapshot = false
}

# ECS Cluster
module "ecs" {
  source = "./modules/ecs"
  
  environment = var.environment
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = module.vpc.private_subnet_ids
  
  cluster_name = "exprora-${var.environment}"
  
  # Application Load Balancer
  alb_enabled = true
  alb_subnet_ids = module.vpc.public_subnet_ids
  
  # ECS Service
  service_name = "exprora-backend"
  task_cpu    = 2048
  task_memory = 4096
  
  desired_count     = 2
  min_capacity      = 2
  max_capacity      = 10
  
  # Auto Scaling
  enable_auto_scaling = true
  target_cpu_utilization = 70
  target_memory_utilization = 80
}

# CloudFront Distribution (for SDK)
module "cloudfront" {
  source = "./modules/cloudfront"
  
  environment = var.environment
  domain_name = var.domain_name
  
  origin_domain = module.ecs.alb_dns_name
  
  # WAF
  enable_waf = true
  waf_web_acl_id = module.waf.web_acl_id
}

# WAF
module "waf" {
  source = "./modules/waf"
  
  environment = var.environment
  
  # Rules
  enable_rate_limiting = true
  rate_limit_requests = 2000
  
  enable_geo_blocking = false
  allowed_countries  = []
  
  enable_bot_protection = true
}

# S3 for backups
resource "aws_s3_bucket" "backups" {
  bucket = "exprora-${var.environment}-backups"
  
  versioning {
    enabled = true
  }
  
  lifecycle_rule {
    id      = "backup-retention"
    enabled = true
    
    expiration {
      days = 90
    }
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
  
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

# Secrets Manager
resource "aws_secretsmanager_secret" "database" {
  name = "exprora/${var.environment}/database"
  
  description = "Database credentials for Exprora ${var.environment}"
  
  recovery_window_in_days = 30
}

resource "aws_secretsmanager_secret" "jwt" {
  name = "exprora/${var.environment}/jwt"
  
  description = "JWT secrets for Exprora ${var.environment}"
  
  recovery_window_in_days = 30
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/exprora/${var.environment}/backend"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "backend_errors" {
  name              = "/exprora/${var.environment}/backend/errors"
  retention_in_days = 90
}

resource "aws_cloudwatch_log_group" "backend_audit" {
  name              = "/exprora/${var.environment}/backend/audit"
  retention_in_days = 365
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "domain_name" {
  description = "Domain name"
  type        = string
  default     = "exprora.com"
}

# Outputs
output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.endpoint
  sensitive   = true
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.ecs.alb_dns_name
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain"
  value       = module.cloudfront.domain_name
}

