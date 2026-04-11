output "jenkins_url" {
  description = "Public URL of the Jenkins instance"
  value       = "http://${google_compute_address.jenkins.address}:8080"
}

output "public_ip" {
  description = "Static external IP address of the Jenkins instance"
  value       = google_compute_address.jenkins.address
}

output "ssh_command" {
  description = "SSH command to connect to the Jenkins instance"
  value       = "gcloud compute ssh jenkins-plus --zone=${var.zone} --project=${var.project}"
}
