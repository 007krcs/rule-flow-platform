variable "azure_region" {
  default = "eastus"
}
variable "db_username" {
  default = "ruleflow"
}
variable "db_password" {
  sensitive = true
}
