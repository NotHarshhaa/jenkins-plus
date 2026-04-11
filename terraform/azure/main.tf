terraform {
  required_version = ">= 1.6.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# ── Resource group ────────────────────────────────────────────────────────────
resource "azurerm_resource_group" "jenkins" {
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}

# ── Virtual network + subnet ─────────────────────────────────────────────────
resource "azurerm_virtual_network" "jenkins" {
  name                = "jenkins-plus-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.jenkins.location
  resource_group_name = azurerm_resource_group.jenkins.name
  tags                = var.tags
}

resource "azurerm_subnet" "jenkins" {
  name                 = "jenkins-plus-subnet"
  resource_group_name  = azurerm_resource_group.jenkins.name
  virtual_network_name = azurerm_virtual_network.jenkins.name
  address_prefixes     = ["10.0.1.0/24"]
}

# ── Network security group ────────────────────────────────────────────────────
resource "azurerm_network_security_group" "jenkins" {
  name                = "jenkins-plus-nsg"
  location            = azurerm_resource_group.jenkins.location
  resource_group_name = azurerm_resource_group.jenkins.name
  tags                = var.tags

  security_rule {
    name                       = "allow-ssh"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "allow-http"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "allow-https"
    priority                   = 120
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "allow-jenkins-http"
    priority                   = 130
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "8080"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "allow-jenkins-agent"
    priority                   = 140
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "50000"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "jenkins" {
  subnet_id                 = azurerm_subnet.jenkins.id
  network_security_group_id = azurerm_network_security_group.jenkins.id
}

# ── Static public IP ──────────────────────────────────────────────────────────
resource "azurerm_public_ip" "jenkins" {
  name                = "jenkins-plus-pip"
  location            = azurerm_resource_group.jenkins.location
  resource_group_name = azurerm_resource_group.jenkins.name
  allocation_method   = "Static"
  sku                 = "Standard"
  tags                = var.tags
}

# ── Network interface ─────────────────────────────────────────────────────────
resource "azurerm_network_interface" "jenkins" {
  name                = "jenkins-plus-nic"
  location            = azurerm_resource_group.jenkins.location
  resource_group_name = azurerm_resource_group.jenkins.name
  tags                = var.tags

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.jenkins.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.jenkins.id
  }
}

# ── Managed disk for jenkins_home ─────────────────────────────────────────────
resource "azurerm_managed_disk" "jenkins_home" {
  name                 = "jenkins-plus-data-disk"
  location             = azurerm_resource_group.jenkins.location
  resource_group_name  = azurerm_resource_group.jenkins.name
  storage_account_type = "Premium_LRS"
  create_option        = "Empty"
  disk_size_gb         = var.disk_size_gb
  tags                 = var.tags
}

# ── Linux VM (Ubuntu 22.04) ────────────────────────────────────────────────────
resource "azurerm_linux_virtual_machine" "jenkins" {
  name                = "jenkins-plus-vm"
  location            = azurerm_resource_group.jenkins.location
  resource_group_name = azurerm_resource_group.jenkins.name
  size                = var.vm_size
  admin_username      = var.admin_username
  tags                = var.tags

  network_interface_ids = [azurerm_network_interface.jenkins.id]

  admin_ssh_key {
    username   = var.admin_username
    public_key = var.ssh_public_key != "" ? var.ssh_public_key : file("~/.ssh/id_rsa.pub")
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
    disk_size_gb         = 30
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  custom_data = base64encode(<<-CLOUDINIT
    #!/bin/bash
    set -euo pipefail
    exec > >(tee /var/log/jenkins-plus-init.log) 2>&1

    echo "=== jenkins-plus bootstrap starting ==="

    # Update and install dependencies
    apt-get update -y
    apt-get install -y docker.io docker-compose-v2 curl git jq

    systemctl enable docker
    systemctl start docker
    usermod -aG docker ${var.admin_username}

    # Mount data disk for jenkins_home
    mkdir -p /var/jenkins_home

    attempt=0
    until [ -b /dev/sdc ] || [ $attempt -ge 30 ]; do
      sleep 5; attempt=$((attempt+1))
    done

    if [ -b /dev/sdc ]; then
      if ! blkid /dev/sdc &>/dev/null; then
        mkfs.ext4 -F /dev/sdc
      fi
      echo "/dev/sdc /var/jenkins_home ext4 defaults,nofail 0 2" >> /etc/fstab
      mount -a
      chown 1000:1000 /var/jenkins_home
    fi

    mkdir -p /opt/jenkins-plus
    cat > /opt/jenkins-plus/.env <<'ENV'
    ADMIN_USER=admin
    ADMIN_PASSWORD=${var.admin_password}
    GITHUB_ORG=${var.github_org}
    JENKINS_URL=http://${azurerm_public_ip.jenkins.ip_address}:8080
    GRAFANA_PASSWORD=admin
    NEXT_PUBLIC_JENKINS_URL=http://${azurerm_public_ip.jenkins.ip_address}:8080
    ENV

    docker pull notharshaa/jenkins-plus:latest
    docker run -d \
      --name jenkins-plus \
      --restart=unless-stopped \
      -p 8080:8080 -p 50000:50000 \
      -v /var/jenkins_home:/var/jenkins_home \
      --env-file /opt/jenkins-plus/.env \
      notharshaa/jenkins-plus:latest

    echo "=== jenkins-plus bootstrap complete ==="
  CLOUDINIT
  )

  lifecycle {
    ignore_changes = [custom_data]
  }
}

# ── Attach data disk ──────────────────────────────────────────────────────────
resource "azurerm_virtual_machine_data_disk_attachment" "jenkins_home" {
  managed_disk_id    = azurerm_managed_disk.jenkins_home.id
  virtual_machine_id = azurerm_linux_virtual_machine.jenkins.id
  lun                = 0
  caching            = "ReadWrite"
}
