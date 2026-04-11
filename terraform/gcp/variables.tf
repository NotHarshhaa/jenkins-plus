variable "project" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "asia-south1"
}

variable "zone" {
  description = "GCP zone"
  type        = string
  default     = "asia-south1-a"
}

variable "machine_type" {
  description = "GCP machine type for the Jenkins instance"
  type        = string
  default     = "e2-standard-2"
}

variable "admin_password" {
  description = "Jenkins admin password"
  type        = string
  sensitive   = true
}

variable "github_org" {
  description = "GitHub organisation for the seed job to scan"
  type        = string
  default     = ""
}

variable "disk_size_gb" {
  description = "Size in GB for the jenkins_home persistent disk"
  type        = number
  default     = 100
}

variable "tags" {
  description = "Map of labels to apply to all resources"
  type        = map(string)
  default = {
    project    = "jenkins-plus"
    managed-by = "terraform"
  }
}
