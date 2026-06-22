output "kv_namespace_id" {
  description = "KV namespace id. Put this in wrangler.toml under [[kv_namespaces]] id."
  value       = cloudflare_workers_kv_namespace.cache.id
}

output "pages_project_name" {
  description = "Cloudflare Pages project name."
  value       = cloudflare_pages_project.site.name
}

output "pages_url" {
  description = "Default Pages URL once the first deployment completes."
  value       = "https://${cloudflare_pages_project.site.name}.pages.dev"
}
