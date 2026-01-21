# Shared Terraform Modules
# Reusable modules for multi-cloud deployment

module "networking" {
  source = "./modules/networking"
}

module "database" {
  source = "./modules/database"
}

module "cache" {
  source = "./modules/cache"
}
