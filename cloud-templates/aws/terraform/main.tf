# AWS Terraform - Complete ECS Deployment
provider "aws" {
  region = var.aws_region
}

resource "aws_ecs_cluster" "main" {
  name = "ruleflow-cluster"
}

resource "aws_db_instance" "postgres" {
  identifier     = "ruleflow-db"
  engine         = "postgres"
  engine_version = "15"
  instance_class = "db.t3.medium"
  allocated_storage = 100
  db_name        = "ruleflow"
  username       = var.db_username
  password       = var.db_password
  skip_final_snapshot = true
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id      = "ruleflow-redis"
  engine          = "redis"
  node_type       = "cache.t3.small"
  num_cache_nodes = 1
}

output "db_endpoint" {
  value = aws_db_instance.postgres.endpoint
}
