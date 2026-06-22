# KV namespace used by the Pages Functions to cache immutable SMHI source files.
resource "cloudflare_workers_kv_namespace" "cache" {
  account_id = var.account_id
  title      = "${var.project_name}-cache"
}

# Cloudflare Pages project hosting the SPA + Functions (functions/ directory).
# The KV namespace is bound as CACHE for both preview and production.
resource "cloudflare_pages_project" "site" {
  account_id        = var.account_id
  name              = var.project_name
  production_branch = var.production_branch

  deployment_configs {
    preview {
      compatibility_date  = "2024-09-23"
      compatibility_flags = ["nodejs_compat"]

      kv_namespaces = {
        CACHE = cloudflare_workers_kv_namespace.cache.id
      }
    }

    production {
      compatibility_date  = "2024-09-23"
      compatibility_flags = ["nodejs_compat"]

      kv_namespaces = {
        CACHE = cloudflare_workers_kv_namespace.cache.id
      }
    }
  }
}
