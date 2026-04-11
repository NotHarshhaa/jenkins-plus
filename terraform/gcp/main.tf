terraform {
  required_version = ">= 1.6.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project
  region  = var.region
  zone    = var.zone
}

# ── VPC network ───────────────────────────────────────────────────────────────
resource "google_compute_network" "jenkins" {
  name                    = "jenkins-plus-network"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "jenkins" {
  name          = "jenkins-plus-subnet"
  region        = var.region
  network       = google_compute_network.jenkins.id
  ip_cidr_range = "10.0.1.0/24"
}

# ── Firewall rules ────────────────────────────────────────────────────────────
resource "google_compute_firewall" "allow_jenkins" {
  name    = "jenkins-plus-allow"
  network = google_compute_network.jenkins.name

  allow {
    protocol = "tcp"
    ports    = ["22", "80", "443", "8080", "50000"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["jenkins-plus"]
}

# ── Static external IP ────────────────────────────────────────────────────────
resource "google_compute_address" "jenkins" {
  name   = "jenkins-plus-ip"
  region = var.region
}

# ── Service account for log storage (GCS) ────────────────────────────────────
resource "google_service_account" "jenkins" {
  account_id   = "jenkins-plus-sa"
  display_name = "jenkins-plus Service Account"
}

resource "google_project_iam_member" "logging" {
  project = var.project
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.jenkins.email}"
}

resource "google_project_iam_member" "monitoring" {
  project = var.project
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.jenkins.email}"
}

# ── Persistent disk for jenkins_home ─────────────────────────────────────────
resource "google_compute_disk" "jenkins_home" {
  name = "jenkins-plus-data"
  type = "pd-ssd"
  zone = var.zone
  size = var.disk_size_gb

  labels = var.tags
}

# ── Compute instance (Container-Optimized OS) ─────────────────────────────────
data "google_compute_image" "cos" {
  family  = "cos-stable"
  project = "cos-cloud"
}

resource "google_compute_instance" "jenkins" {
  name         = "jenkins-plus"
  machine_type = var.machine_type
  zone         = var.zone
  tags         = ["jenkins-plus"]

  labels = var.tags

  boot_disk {
    initialize_params {
      image = data.google_compute_image.cos.self_link
      size  = 30
      type  = "pd-ssd"
    }
  }

  attached_disk {
    source      = google_compute_disk.jenkins_home.self_link
    device_name = "jenkins-home"
    mode        = "READ_WRITE"
  }

  network_interface {
    subnetwork = google_compute_subnetwork.jenkins.id

    access_config {
      nat_ip = google_compute_address.jenkins.address
    }
  }

  service_account {
    email  = google_service_account.jenkins.email
    scopes = ["cloud-platform"]
  }

  metadata = {
    user-data = <<-CLOUDINIT
      #cloud-config
      runcmd:
        - mkdir -p /var/jenkins_home
        - |
          # Wait for the attached disk to appear
          attempt=0
          until [ -b /dev/disk/by-id/google-jenkins-home ] || [ $attempt -ge 30 ]; do
            sleep 5; attempt=$((attempt+1))
          done
          DEV=$(readlink -f /dev/disk/by-id/google-jenkins-home)
          if ! blkid "$DEV" &>/dev/null; then mkfs.ext4 -F "$DEV"; fi
          echo "$DEV /var/jenkins_home ext4 defaults,nofail 0 2" >> /etc/fstab
          mount -a
          chown 1000:1000 /var/jenkins_home
        - mkdir -p /opt/jenkins-plus
        - |
          cat > /opt/jenkins-plus/.env <<'EOF'
          ADMIN_USER=admin
          ADMIN_PASSWORD=${var.admin_password}
          GITHUB_ORG=${var.github_org}
          JENKINS_URL=http://${google_compute_address.jenkins.address}:8080
          GRAFANA_PASSWORD=admin
          NEXT_PUBLIC_JENKINS_URL=http://${google_compute_address.jenkins.address}:8080
          EOF
        - docker run -d --name jenkins-plus --restart=unless-stopped -p 8080:8080 -p 50000:50000 -v /var/jenkins_home:/var/jenkins_home --env-file /opt/jenkins-plus/.env notharshaa/jenkins-plus:latest
    CLOUDINIT

    google-logging-enabled = "true"
  }

  lifecycle {
    ignore_changes = [metadata, boot_disk[0].initialize_params[0].image]
  }
}
