# DoliPaaS Minimal Testing Environment Checklist

This checklist provides a structured approach to verify that the minimal testing environment for Dolibarr deployments is functioning correctly. Use this guide to validate your deployment before proceeding with more extensive testing.

## Initial Setup Verification

### VM Configuration
- [ ] VM is accessible via SSH
- [ ] System packages are up-to-date
- [ ] Docker is installed and running
- [ ] Docker Compose is installed and functioning
- [ ] Firewall is properly configured (ports 22, 80, 443 open)

### Deployment Script Execution
- [ ] `minimal-testing-setup.sh` script executed without errors
- [ ] Docker Compose file created successfully
- [ ] Environment variables file (.env) created successfully
- [ ] Monitoring script created and executable

## Dolibarr Deployment Testing

### Container Deployment
- [ ] `docker-compose up -d` command executes successfully
- [ ] Both database and Dolibarr containers are running
- [ ] No error messages in container logs
- [ ] Containers restart properly after VM reboot

### Application Access
- [ ] Dolibarr web interface accessible at http://SERVER_IP:8080
- [ ] Login page loads correctly
- [ ] Admin login works with default credentials
- [ ] Dolibarr dashboard loads without errors

### Basic Functionality
- [ ] Company information can be configured
- [ ] Users can be created
- [ ] Products/services can be added
- [ ] Basic modules are functioning (check modules specified in docker-compose.yml)

## Monitoring Verification

### Resource Monitoring
- [ ] `monitor.sh` script executes without errors
- [ ] Container status is correctly reported
- [ ] Resource usage statistics are displayed
- [ ] Disk usage information is accurate

### Logs
- [ ] Container logs are accessible
- [ ] No critical errors in logs
- [ ] Database connection is stable

## API Testing (If Backend API is Deployed)

### Authentication
- [ ] User registration endpoint works
- [ ] Login endpoint returns valid JWT token
- [ ] Protected routes require authentication

### Deployment Management
- [ ] Deployment creation endpoint functions
- [ ] Deployment status endpoint returns accurate information
- [ ] Container control endpoints (start/stop/restart) work correctly

## Performance Observations

### Deployment Performance
- [ ] Initial deployment time: _______ minutes
- [ ] Memory usage at idle: _______ MB
- [ ] CPU usage at idle: _______ %
- [ ] Disk space used: _______ GB

### Application Performance
- [ ] Page load times are acceptable
- [ ] Database operations complete in reasonable time
- [ ] No noticeable lag during basic operations

## Issues and Observations

Use this section to document any issues encountered or observations made during testing:

1. 
2. 
3. 

## Next Steps

Based on the testing results, determine which of the following steps should be taken:

- [ ] Proceed with more extensive testing
- [ ] Implement backup/restore functionality
- [ ] Enhance monitoring capabilities
- [ ] Improve deployment configuration options
- [ ] Begin frontend dashboard development
- [ ] Address specific issues identified during testing

---

*This checklist is designed for the minimal testing environment. For production deployments, additional security and performance testing will be required.*