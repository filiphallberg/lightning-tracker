terraform {
  required_version = ">= 1.6.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.40"
    }
  }
}

provider "cloudflare" {
  # Supply via env var CLOUDFLARE_API_TOKEN (preferred) or -var api_token=...
  api_token = var.api_token != "" ? var.api_token : null
}
