variable "api_token" {
  description = "Cloudflare API token. Prefer the CLOUDFLARE_API_TOKEN env var instead."
  type        = string
  default     = ""
  sensitive   = true
}

variable "account_id" {
  description = "Cloudflare account ID that will own the Pages project and KV namespace."
  type        = string
}

variable "project_name" {
  description = "Cloudflare Pages project name (also the *.pages.dev subdomain)."
  type        = string
  default     = "skyfall-weather-viz"
}

variable "production_branch" {
  description = "Git branch treated as the production deployment."
  type        = string
  default     = "main"
}
