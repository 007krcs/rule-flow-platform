# GCP Terraform - Cloud Run Deployment
provider "google" {
  project = var.gcp_project
  region  = var.gcp_region
}

resource "google_cloud_run_service" "rule_engine" {
  name     = "ruleflow-rule-engine"
  location = var.gcp_region

  template {
    spec {
      containers {
        image = "gcr.io/${var.gcp_project}/rule-engine:latest"
        ports {
          container_port = 3001
        }
      }
    }
  }
}

resource "google_sql_database_instance" "postgres" {
  name             = "ruleflow-postgres"
  database_version = "POSTGRES_15"
  region           = var.gcp_region

  settings {
    tier = "db-f1-micro"
  }
}

resource "google_redis_instance" "main" {
  name           = "ruleflow-redis"
  memory_size_gb = 1
  region         = var.gcp_region
}

output "sql_instance" {
  value = google_sql_database_instance.postgres.connection_name
}
