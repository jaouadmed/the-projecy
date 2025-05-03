# DoliPaaS - Open Source Application Deployment Platform

DoliPaaS is a SaaS platform that enables users to self-deploy open-source applications like Dolibarr ERP/CRM, WordPress, and Odoo from a user-friendly dashboard. The initial focus is on Dolibarr with plans to expand to other applications later.

This project is an MVP (Minimum Viable Product) with the essential requirements to be a viable product.

## Project Overview

The DoliPaaS platform allows users to:

- Deploy Dolibarr ERP/CRM instances through a user-friendly dashboard
- Manage their deployed applications
- Monitor application status and performance
- Future: Deploy WordPress and Odoo instances

## Documentation

This repository contains the following documentation:

- [Project Structure](./project-structure.md) - Detailed folder organization for the platform
- [Implementation Plan](./implementation-plan.md) - Step-by-step plan with trackable milestones
- [Technical Requirements](./technical-requirements.md) - Detailed specifications for all components
- [Contabo Deployment Guide](./contabo-deployment-guide.md) - Instructions for deploying on Contabo VMs
- [Testing Guide](./testing-guide.md) - Comprehensive testing procedures

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (v16 or higher)
- Git

### Development Setup

1. Clone this repository
   ```bash
   git clone https://github.com/yourusername/dolipaas.git
   cd dolipaas
   ```

2. Start the development environment
   ```bash
   docker-compose up -d
   ```

3. Access the application
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - Dolibarr (example): http://localhost:8080

## Deployment

For production deployment, follow the [Contabo Deployment Guide](./contabo-deployment-guide.md).

## Project Roadmap

1. **Phase 1 (Current)**: Dolibarr deployment functionality
2. **Phase 2**: WordPress deployment
3. **Phase 3**: Odoo deployment
4. **Phase 4**: Advanced features (custom domains, scaling options, etc.)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Dolibarr ERP & CRM](https://www.dolibarr.org/)
- [Docker](https://www.docker.com/)
- [Contabo](https://contabo.com/)