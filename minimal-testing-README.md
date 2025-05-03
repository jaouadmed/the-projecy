# DoliPaaS Minimal Testing Environment

This directory contains resources for setting up and testing a minimal DoliPaaS environment focused on Dolibarr integration, which is our MVP priority.

## Overview

The minimal testing environment is designed to provide a streamlined setup for testing Dolibarr deployments on Contabo VMs. It focuses exclusively on the core functionality needed to deploy and manage Dolibarr instances, deferring other features for future development.

## Quick Start

1. Provision a Contabo VM with Ubuntu 22.04 LTS (minimum 4 vCPU, 8GB RAM)
2. SSH into your VM
3. Download the setup script:
   ```bash
   wget -O minimal-testing-setup.sh https://raw.githubusercontent.com/your-repo/dolipaas/main/scripts/minimal-testing-setup.sh
   chmod +x minimal-testing-setup.sh
   ```
4. Run the setup script:
   ```bash
   ./minimal-testing-setup.sh
   ```
5. Start the Dolibarr deployment:
   ```bash
   cd /opt/dolipaas
   docker-compose up -d
   ```
6. Access Dolibarr at http://YOUR_SERVER_IP:8080
   - Default login: admin
   - Default password: admin

## Key Files

- `minimal-testing-environment.md`: Detailed implementation plan
- `minimal-testing-checklist.md`: Testing verification checklist
- `scripts/minimal-testing-setup.sh`: Automated setup script for Contabo VMs

## Testing Process

1. Set up the environment using the quick start guide above
2. Use the `minimal-testing-checklist.md` to verify your deployment
3. Document any issues or observations
4. Proceed with implementing the next priority features based on testing results

## Next Steps After Testing

1. Implement backup/restore functionality (highest post-MVP priority)
2. Enhance monitoring capabilities
3. Improve deployment configuration options
4. Develop more comprehensive frontend features

## Resources

- `contabo-deployment-guide.md`: Full deployment guide for reference
- `testing-guide.md`: Comprehensive testing procedures
- `progress-tracking.md`: Overall project progress tracking

---

*This minimal testing environment focuses exclusively on the essential components needed to test Dolibarr deployments in a real environment. By limiting scope to these core features, we aim to have a testable system within 1-2 weeks.*