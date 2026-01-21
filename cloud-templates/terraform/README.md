# Multi-Cloud Terraform Modules

Shared modules for AWS, Azure, and GCP deployments.

## Usage

```hcl
module "ruleflow" {
  source = "./modules/ruleflow"
  cloud_provider = "aws" # or "azure" or "gcp"
}
```
