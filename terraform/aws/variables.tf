variable "region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-south-1"
}

variable "instance_type" {
  description = "EC2 instance type for the Jenkins controller"
  type        = string
  default     = "t3.large"
}

variable "public_key_path" {
  description = "Path to the SSH public key file to associate with the EC2 instance"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
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

variable "enable_https" {
  description = "Whether to configure HTTPS (requires domain_name and a certificate)"
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Domain name for the Jenkins instance (used when enable_https = true)"
  type        = string
  default     = ""
}

variable "ebs_volume_size" {
  description = "Size in GiB for the jenkins_home EBS data volume"
  type        = number
  default     = 100
}

variable "ebs_volume_type" {
  description = "EBS volume type (gp3 recommended)"
  type        = string
  default     = "gp3"
}

variable "tags" {
  description = "Map of tags to apply to all resources"
  type        = map(string)
  default = {
    Project   = "jenkins-plus"
    ManagedBy = "terraform"
  }
}
