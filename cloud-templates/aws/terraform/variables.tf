variable "aws_region" {
  default = "us-east-1"
}
variable "db_username" {
  default = "ruleflow"
}
variable "db_password" {
  sensitive = true
}
