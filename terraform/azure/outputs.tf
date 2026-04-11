output "jenkins_url" {
  description = "Public URL of the Jenkins instance"
  value       = "http://${azurerm_public_ip.jenkins.ip_address}:8080"
}

output "public_ip" {
  description = "Static public IP address of the Jenkins VM"
  value       = azurerm_public_ip.jenkins.ip_address
}

output "ssh_command" {
  description = "SSH command to connect to the Jenkins VM"
  value       = "ssh ${var.admin_username}@${azurerm_public_ip.jenkins.ip_address}"
}
