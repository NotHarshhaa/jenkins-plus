output "jenkins_url" {
  description = "Public URL of the Jenkins instance"
  value       = "http://${aws_eip.jenkins.public_ip}:8080"
}

output "public_ip" {
  description = "Elastic IP address of the Jenkins instance"
  value       = aws_eip.jenkins.public_ip
}

output "ssh_command" {
  description = "SSH command to connect to the Jenkins instance"
  value       = "ssh -i ${var.public_key_path} ec2-user@${aws_eip.jenkins.public_ip}"
}

output "grafana_url" {
  description = "Grafana dashboard URL"
  value       = "http://${aws_eip.jenkins.public_ip}:3001"
}

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.jenkins.id
}
