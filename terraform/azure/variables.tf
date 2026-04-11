variable "resource_group_name" {
  description = "Name of the Azure resource group"
  type        = string
  default     = "jenkins-plus-rg"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "centralindia"
}

variable "vm_size" {
  description = "Azure VM size for the Jenkins instance"
  type        = string
  default     = "Standard_D2s_v3"
}

variable "admin_username" {
  description = "SSH admin username for the VM"
  type        = string
  default     = "jenkins"
}

variable "admin_password" {
  description = "Jenkins admin password"
  type        = string
  sensitive   = true
}

variable "ssh_public_key" {
  description = "SSH public key content for VM authentication"
  type        = string
  default     = ""
}

variable "github_org" {
  description = "GitHub organisation for the seed job to scan"
  type        = string
  default     = ""
}

variable "disk_size_gb" {
  description = "Size in GB for the jenkins_home managed disk"
  type        = number
  default     = 100
}

variable "tags" {
  description = "Map of tags to apply to all resources"
  type        = map(string)
  default = {
    Project   = "jenkins-plus"
    ManagedBy = "terraform"
  }
}
