# DoliPaaS Integration Guide

This README provides an overview of how the DoliPaaS platform integrates the frontend, backend, and Dolibarr components into a cohesive system.

## Integration Architecture

![DoliPaaS Architecture](https://via.placeholder.com/800x400?text=DoliPaaS+Architecture)

The DoliPaaS platform consists of the following integrated components:

1. **Frontend**: React.js application that provides the user interface for managing Dolibarr deployments
2. **Backend**: Node.js API server that handles business logic and communicates with Dolibarr
3. **Dolibarr**: The core ERP/CRM application that is being deployed and managed
4. **Nginx**: Reverse proxy that routes traffic between the components
5. **Databases**: Separate databases for the platform and Dolibarr instances

## Integration Files

The following files have been created or modified to support the integration:

- `integrated-deployment-guide.md`: Comprehensive guide for deploying all components together
- `docker-compose.yml`: Updated to include all services with proper networking
- `infrastructure/nginx/conf.d/default.conf`: Nginx configuration for routing traffic
- `.env.example`: Template for environment variables
- `setup-integrated-environment.sh`: Script to automate the deployment process

## Integration Flow

1. **User Authentication**: Users authenticate through the frontend, which communicates with the backend API
2. **Deployment Management**: The backend API creates and manages Dolibarr deployments
3. **API Communication**: The frontend communicates with Dolibarr through the backend API
4. **Reverse Proxy**: Nginx routes traffic to the appropriate service based on the URL path

## How to Deploy

Follow these steps to deploy the integrated platform:

1. Clone the repository
2. Copy `.env.example` to `.env` and update the values
3. Run the setup script: `bash setup-integrated-environment.sh`
4. Access the platform at http://your-domain.com

For detailed deployment instructions, refer to the `integrated-deployment-guide.md` file.

## Integration Points

### Frontend to Backend

The frontend communicates with the backend through RESTful API calls. The API URL is configured in the `.env` file:

```
VITE_API_URL=http://your-domain.com:4000/api
```

### Backend to Dolibarr

The backend communicates with Dolibarr through its API. The connection details are stored in the database and managed through the `DolibarrConfig` model.

### Nginx Routing

Nginx routes traffic based on the URL path:

- `/`: Frontend application
- `/api`: Backend API
- `/dolibarr`: Dolibarr application

## Troubleshooting

If you encounter issues with the integration, check the following:

1. Ensure all environment variables are correctly set in the `.env` file
2. Check the Docker container logs: `docker-compose logs -f [service_name]`
3. Verify that Nginx is correctly routing traffic to the appropriate services
4. Check network connectivity between containers

## Security Considerations

1. Always change default passwords in the `.env` file
2. Use HTTPS in production by configuring SSL certificates in Nginx
3. Implement proper authentication and authorization
4. Regularly update all components

## Next Steps

1. Implement SSL/TLS for secure communication
2. Add monitoring and alerting
3. Implement automated backups
4. Add support for additional applications (WordPress, Odoo, etc.)

For more information, refer to the technical requirements document and the implementation plan.