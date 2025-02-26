packer {
  required_version = ">= 1.7.0"
  required_plugins {
    amazon = {
      version = ">= 1.0.0"
      source  = "github.com/hashicorp/amazon"
    }
    googlecompute = {
      version = ">= 1.0.0"
      source  = "github.com/hashicorp/googlecompute"
    }
  }
}

variable "aws_region" {
  type = string
}

variable "gcp_project_id" {
  type = string
}

variable "gcp_region" {
  type = string
}

variable "db_name" {
  type = string
}

variable "db_user" {
  type = string
}

variable "db_password" {
  type = string
}

variable "db_host" {
  type    = string
  default = "localhost"
}

source "amazon-ebs" "aws_image" {
  profile       = "dev"
  region        = var.aws_region
  instance_type = "t2.micro"
  ami_name      = "custom-node-postgres-app-{{timestamp}}"
  source_ami_filter {
    filters = {
      name                = "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    owners      = ["099720109477"] # Canonical
    most_recent = true
  }

  ssh_username = "ubuntu"
  ami_block_device_mappings {
    device_name           = "/dev/sda1"
    volume_size           = 15
    volume_type           = "gp2"
    delete_on_termination = true
  }
  tags = {
    Name = "CustomNodeAppImage"
  }
}

source "googlecompute" "gcp_image" {
  project_id              = var.gcp_project_id
  zone                    = "${var.gcp_region}-a"
  machine_type            = "e2-medium"
  image_name              = "custom-node-postgres-app-{{timestamp}}"
  source_image_family     = "ubuntu-2204-lts"
  source_image_project_id = ["ubuntu-os-cloud"]
  ssh_username            = "packer"
}

build {
  name    = "custom-node-postgres-image"
  sources = ["source.amazon-ebs.aws_image", "source.googlecompute.gcp_image"]

  provisioner "shell" {
    inline = [
      "mkdir -p /tmp/webapp"
    ]
  }

  # Copy the entire webapp directory to the target machine
  provisioner "file" {
    source      = "./"
    destination = "/tmp/webapp/"
  }

  provisioner "shell" {
    environment_vars = [
      "DB_NAME=${var.db_name}",
      "DB_USER=${var.db_user}",
      "DB_PASSWORD=${var.db_password}",
      "DB_HOST=${var.db_host}"
    ]
    inline = [
      "chmod +x /tmp/webapp/scripts/setup.sh",
      "/tmp/webapp/scripts/setup.sh"
    ]
  }

  # Step 1: Capture AMI details
  post-processor "manifest" {
    output = "ami_manifest.json"
  }

  # Step 2: Extract AMI ID and Share It
  post-processor "manifest" {
    output = "ami_manifest.json"
  }

  post-processor "shell-local" {
    only = ["amazon-ebs.aws_image"]
    inline = [
      "echo 'Fetching latest AMI ID from AWS...'",
      "AMI_ID=$(aws ec2 describe-images --owners self --filters 'Name=name,Values=custom-node-postgres-app-*' --query 'Images[-1].ImageId' --output text)",
      "echo 'Extracted AMI ID:' $AMI_ID",
      "[ -z \"$AMI_ID\" ] && echo 'Error: AMI_ID not found in AWS!' && exit 1",
      "aws ec2 modify-image-attribute --image-id $AMI_ID --launch-permission 'Add=[{UserId=396913717917},{UserId=376129858668}]' --region ${var.aws_region}"
    ]
  }



}

