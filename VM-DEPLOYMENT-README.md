# DoliPaaS VM Deployment

This directory contains resources for deploying the DoliPaaS platform exclusively on a Contabo Virtual Machine, with no local machine dependencies. All operations, including setup, configuration, and management, are performed directly on the VM.

## Overview

The DoliPaaS platform is designed to be deployed on a Contabo VM, providing a scalable and reliable environment for running Dolibarr instances. This deployment approach eliminates the need for any local development environment, as all operations are performed directly on the VM.

## Key Files

- **[vm-deployment-guide.md](./vm-deployment-guide.md)**: Comprehensive guide for deploying DoliPaaS on a Contabo VM
- **[scripts/vm-setup.sh](./scripts/vm-setup.sh)**: Automated setup script for VM deployment
- **[scripts/monitor-dolipaas.sh](./scripts/monitor-dolipaas.sh)**: Monitoring script for the DoliPaaS platform
- **[infrastructure/kubernetes/dolipaas-deployment.yaml](./infrastructure/kubernetes/dolipaas-deployment.yaml)**: Kubernetes deployment configuration (optional)

## Deployment Options

### Docker Compose Deployment (Recommended)

The primary deployment method uses Docker Compose to set up the DoliPaaS platform on a Contabo VM. This approach is simpler and requires less resources than Kubernetes.

1. Provision a Contabo VM with Ubuntu 22.04 LTS
2. Follow the instructions in [vm-deployment-guide.md](./vm-deployment-guide.md)
3. Alternatively, use the automated setup script: `bash scripts/vm-setup.sh`

### Kubernetes Deployment (Advanced)

For users who prefer Kubernetes or need more advanced orchestration capabilities:

1. Set up a Kubernetes cluster on your VM
2. Apply the Kubernetes deployment configuration: `kubectl apply -f infrastructure/kubernetes/dolipaas-deployment.yaml`
3. Configure ingress and persistent storage as needed

## Monitoring and Management

Use the provided monitoring script to check the health and status of your DoliPaaS deployment:

```bash
bash scripts/monitor-dolipaas.sh
```

This script provides options for checking container status, logs, resource usage, database status, and more.

## Backup and Restore

The deployment includes scripts for backing up and restoring your DoliPaaS data:

- Backup: `/opt/dolipaas/backup.sh`
- Restore: `/opt/dolipaas/restore.sh <backup_file>`

It's recommended to set up scheduled backups using cron.

## Support

For additional support or to report issues, please refer to the project documentation or contact the support team.