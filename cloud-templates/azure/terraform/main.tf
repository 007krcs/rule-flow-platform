# Azure Terraform - Container Apps Deployment
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "main" {
  name     = "ruleflow-rg"
  location = var.azure_region
}

resource "azurerm_container_app_environment" "main" {
  name                = "ruleflow-env"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
}

resource "azurerm_postgresql_flexible_server" "main" {
  name                = "ruleflow-postgres"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  version             = "15"
  administrator_login    = var.db_username
  administrator_password = var.db_password
  storage_mb          = 32768
  sku_name            = "B_Standard_B1ms"
}

output "postgres_fqdn" {
  value = azurerm_postgresql_flexible_server.main.fqdn
}
