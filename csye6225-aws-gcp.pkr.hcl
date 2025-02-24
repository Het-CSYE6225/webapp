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

  provisioner "file" {
    source      = "."
    destination = "/tmp/webapp"
  }

  provisioner "shell" {
    inline = [
      "chmod +x /tmp/webapp/scripts/setup.sh",


      "/tmp/webapp/scripts/setup.sh"
    ]
  }

}
