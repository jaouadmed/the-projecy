# DoliPaaS Minimal Testing Environment Implementation Guide

This guide provides step-by-step instructions for implementing the minimal testing environment for DoliPaaS, focusing on Dolibarr integration as our MVP priority.

## Prerequisites

- Contabo VM with Ubuntu 22.04 LTS (minimum 4 vCPU, 8GB RAM)
- SSH access to the VM
- Basic knowledge of Linux commands
- Git access to the DoliPaaS repository

## Implementation Steps

### 1. Prepare Your Environment

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-repo/dolipaas.git
   cd dolipaas
   ```

2. **Review the Minimal Testing Plan**
   - Read through `minimal-testing-environment.md` to understand the implementation priorities
   - Review `minimal-testing-checklist.md` to familiarize yourself with the testing requirements

### 2. Deploy to Contabo VM

1. **SSH into Your VM**
   ```bash
   ssh user@your-contabo-vm-ip
   ```

2. **Upload the Setup Script**
   ```bash
   # From your local machine
   scp scripts/minimal-testing-setup.sh user@your-contabo-vm-ip:/tmp/
   ```

3. **Run the Setup Script**
   ```bash
   # On the VM
   chmod +x /tmp/minimal-testing-setup.sh
   /tmp/minimal-testing-setup.sh
   ```

4. **Start Dolibarr**
   ```bash
   cd /opt/dolipaas
   docker-compose up -d
   ```

### 3. Verify Deployment

1. **Check Container Status**
   ```bash
   docker ps
   ```

2. **Run the Monitoring Script**
   ```bash
   # Upload the monitoring script first
   scp scripts/monitor-dolibarr.sh user@your-contabo-vm-ip:/opt/dolipaas/
   
   # On the VM
   chmod +x /opt/dolipaas/monitor-dolibarr.sh
   /opt/dolipaas/monitor-dolibarr.sh
   ```

3. **Access Dolibarr**
   - Open a web browser and navigate to `http://your-contabo-vm-ip:8080`
   - Login with the default credentials (admin/admin)

### 4. Test API Functionality (If Backend API is Deployed)

1. **Deploy Backend API**
   ```bash
   # Clone the repository on the VM if not already done
   git clone https://github.com/your-repo/dolipaas.git /opt/dolipaas-api
   cd /opt/dolipaas-api/backend
   
   # Install dependencies
   npm install
   
   # Start the API server
   npm start
   ```

2. **Run API Tests**
   ```bash
   # Upload the API test script
   scp scripts/test-api.sh user@your-contabo-vm-ip:/opt/dolipaas-api/
   
   # On the VM
   chmod +x /opt/dolipaas-api/test-api.sh
   /opt/dolipaas-api/test-api.sh
   ```

### 5. Complete Testing Checklist

1. **Download the Testing Checklist**
   ```bash
   # On the VM
   wget -O /opt/dolipaas/testing-checklist.md https://raw.githubusercontent.com/your-repo/dolipaas/main/minimal-testing-checklist.md
   ```

2. **Go Through Each Item**
   - Systematically verify each item in the checklist
   - Document any issues or observations

## Troubleshooting

### Common Issues

1. **Docker Containers Not Starting**
   ```bash
   # Check logs
   docker logs dolibarr-app
   docker logs dolibarr-db
   
   # Restart containers
   docker-compose down
   docker-compose up -d
   ```

2. **Dolibarr Not Accessible**
   ```bash
   # Check if port is open
   sudo ufw status
   
   # Ensure port is allowed
   sudo ufw allow 8080/tcp
   ```

3. **Database Connection Issues**
   ```bash
   # Check if MariaDB is running
   docker exec -it dolibarr-db mysqladmin -u root -p status
   ```

## Next Steps

After successfully implementing and testing the minimal environment:

1. **Document Your Findings**
   - Update the progress tracking document with your results
   - Note any issues that need to be addressed

2. **Implement Backup/Restore**
   - This is the highest post-MVP priority
   - Begin development of backup/restore functionality for Dolibarr deployments

3. **Enhance Frontend**
   - Develop the minimal frontend dashboard for deployment management
   - Focus on essential controls and status displays

4. **Gather Feedback**
   - Share the testing environment with stakeholders
   - Collect feedback for improvements

## Resources

- `minimal-testing-environment.md`: Detailed implementation plan
- `minimal-testing-checklist.md`: Testing verification checklist
- `scripts/minimal-testing-setup.sh`: Automated setup script
- `scripts/monitor-dolibarr.sh`: Monitoring script
- `scripts/test-api.sh`: API testing script
- `contabo-deployment-guide.md`: Full deployment guide for reference

---

*This implementation guide focuses on getting the minimal testing environment up and running quickly. For a more comprehensive deployment, refer to the full deployment guide.*