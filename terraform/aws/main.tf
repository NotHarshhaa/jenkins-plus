terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = var.tags
  }
}

# ── Latest Amazon Linux 2023 AMI (never hardcoded) ───────────────────────────
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ── VPC ──────────────────────────────────────────────────────────────────────
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "jenkins-plus-vpc" }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "jenkins-plus-igw" }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "${var.region}a"

  tags = { Name = "jenkins-plus-public-subnet" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = { Name = "jenkins-plus-rt" }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# ── Security group ───────────────────────────────────────────────────────────
resource "aws_security_group" "jenkins" {
  name        = "jenkins-plus-sg"
  description = "Allow SSH, HTTP, HTTPS, and Jenkins agent traffic"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Jenkins HTTP"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Jenkins agent TCP"
    from_port   = 50000
    to_port     = 50000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "jenkins-plus-sg" }
}

# ── SSH key pair ─────────────────────────────────────────────────────────────
resource "aws_key_pair" "jenkins" {
  key_name   = "jenkins-plus-key"
  public_key = file(var.public_key_path)
}

# ── IAM role for EC2 (SSM access + CloudWatch) ───────────────────────────────
data "aws_iam_policy_document" "ec2_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "jenkins" {
  name               = "jenkins-plus-ec2-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.jenkins.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "cloudwatch" {
  role       = aws_iam_role.jenkins.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "jenkins" {
  name = "jenkins-plus-instance-profile"
  role = aws_iam_role.jenkins.name
}

# ── EBS data volume for jenkins_home ─────────────────────────────────────────
resource "aws_ebs_volume" "jenkins_home" {
  availability_zone = "${var.region}a"
  size              = var.ebs_volume_size
  type              = var.ebs_volume_type
  encrypted         = true

  tags = { Name = "jenkins-plus-data" }
}

# ── EC2 instance ─────────────────────────────────────────────────────────────
resource "aws_instance" "jenkins" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  key_name               = aws_key_pair.jenkins.key_name
  vpc_security_group_ids = [aws_security_group.jenkins.id]
  iam_instance_profile   = aws_iam_instance_profile.jenkins.name

  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    delete_on_termination = true
    encrypted             = true
  }

  user_data = templatefile("${path.module}/user_data.sh.tpl", {
    admin_password = var.admin_password
    github_org     = var.github_org
    jenkins_url    = var.enable_https && var.domain_name != "" ? "https://${var.domain_name}" : ""
    ebs_device     = "/dev/xvdf"
  })

  tags = { Name = "jenkins-plus" }

  lifecycle {
    ignore_changes = [ami, user_data]
  }
}

# ── Attach EBS volume ─────────────────────────────────────────────────────────
resource "aws_volume_attachment" "jenkins_home" {
  device_name  = "/dev/xvdf"
  volume_id    = aws_ebs_volume.jenkins_home.id
  instance_id  = aws_instance.jenkins.id
  force_detach = false
}

# ── Elastic IP ───────────────────────────────────────────────────────────────
resource "aws_eip" "jenkins" {
  instance = aws_instance.jenkins.id
  domain   = "vpc"

  tags = { Name = "jenkins-plus-eip" }

  depends_on = [aws_internet_gateway.igw]
}
