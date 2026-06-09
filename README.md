# Fonteyn Vouchers

A comprehensive web application designed to configure, manage, and print vouchers for the pfSense captive portal. 

By default, pfSense doesn't provide an extensive API or modern interface specifically tailored for captive portal voucher management with role-based access. This project bridges that gap by providing a Node.js backend to securely handle pfSense communication and a sleek Vue 3 frontend for an intuitive user experience.

## Features

- **Voucher Management**: Create, list, enable/disable, and delete vouchers directly on pfSense from a custom UI.
- **Metadata Tracking**: Attach custom metadata (e.g., guest name, room number, purpose) to vouchers for record-keeping and auditing.
- **Printing**: Generate and print voucher information optimized for regular A4 paper.
- **Secure Authentication**: 
  - Supports Microsoft Entra ID (Azure AD) for Single Sign-On (SSO).
  - Fallback local email/password login.
- **Role-Based Access Control (RBAC)**: Manage user permissions with distinct `admin`, `editor`, and `viewer` roles.

## System Architecture

- **Frontend**: Vue 3 + Vite. Provides a modern, responsive user interface.
- **Backend**: Node.js (Express). Acts as a secure middleman between the frontend and the pfSense router. It uses `axios` and `cheerio` to interact with the pfSense web interface securely without exposing router credentials to the client.
- **Database**: MySQL. Stores user accounts, roles, and voucher metadata. Managed via Docker Compose.

## Prerequisites

Before deploying the application, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Docker](https://www.docker.com/) and Docker Compose (for the MySQL database)
- A pfSense router with the Captive Portal feature enabled and configured.

## Installation & Deployment

The entire system is containerized and can be easily deployed using Docker Compose. This will spin up the MySQL database, the Node.js backend, and the Nginx server hosting the Vue 3 frontend.

### 1. Configuration

Before starting, configure your backend environment variables. Create or modify the `.env` file in the `backend/` directory:

```env
# pfSense Configuration
PF_API_URL=https://[IP_ADDRESS]/api/v1/firewall/pf/auth
PF_USERNAME=your_pfsense_username
PF_PASSWORD=your_pfsense_password
PF_SSL_VERIFY=false

# Application Secrets
SESSION_SECRET=my_super_secret_session_key

# Microsoft Entra ID Configuration (SSO)
ENTRA_TENANT_ID=your_tenant_id
ENTRA_CLIENT_ID=your_client_id
ENTRA_CLIENT_SECRET=your_client_secret

# Database Configuration (Optional Overrides)
# Note: When using Docker Compose, the DB_HOST and DB_PORT 
# are automatically set to point to the MySQL container.
```

### 2. Start the System

From the root of the project, run:
```bash
docker compose up -d --build
```

This command will:
- Start the `fonteyn_mysql` database container.
- Build and start the `fonteyn_backend` container on port `3000`.
- Build the Vue frontend and serve it using an Nginx container (`fonteyn_frontend`) on port `80`.

## Usage

1. **Access the Application**: Once all containers are up, open your browser and navigate to `http://localhost` (or the IP address of your server).
2. **Login**: 
   - Use the **Microsoft Entra ID** button to sign in with your corporate account.
   - Alternatively, use the fallback local credentials if configured in your database.
3. **Dashboard**: 
   - View a list of active and inactive vouchers.
   - Click **Create Voucher** to generate new access codes and attach metadata like "Guest Name" or "Room Number".
   - Select vouchers to **Print**, which formats them nicely for A4 paper hand-outs.
   - Use the actions menu to disable or delete expired vouchers.

## Security Considerations

- **Credentials**: Never commit the `.env` file or expose pfSense credentials to the frontend. The backend securely manages all pfSense interactions.
- **SSL Verification**: For production, ensure your pfSense router has a valid SSL certificate and set `PF_SSL_VERIFY=true` in the backend `.env`.
- **Database**: The default `docker-compose.yml` uses basic credentials. Ensure you change these in production and restrict database port exposure if necessary.
