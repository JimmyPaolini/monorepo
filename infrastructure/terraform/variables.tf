variable "linode_token" {
  description = "The Linode API token."
  sensitive   = true
}

variable "linode_region" {
  description = "The region for the Linode Kubernetes Engine (LKE) cluster."
  type        = string
  default     = "us-east"
}

variable "linode_kubernetes_engine_cluster_id" {
  description = "The ID of the existing Linode Kubernetes Engine (LKE) cluster."
  type        = string
}
