Your task is to create a webpage that allows users to configure, manage and print vouchers for the pfsense captive portal. Any credentials should be kept away from the frontend, use a nodejs backend server to manage the connection to pfsense. Do not attempt to run any scripts or commands on the pfsense router itself - keep everything within the nodejs backend. Use best practices for security and code quality.

The login details for the pfSense router backend API will be provided in an .env file in the backend directory. It will look like:
PF_API_URL=https://[IP_ADDRESS]/api/v1/firewall/pf/auth
PF_USERNAME=username
PF_PASSWORD=password
PF_SSL_VERIFY=false

Allow login into the web interface using Microsoft Entra ID and also offer a fallback of email/password login. Create a user and password, and use that for the fallback. This must be secure and also allow for role based access control to the web interface. (admin/editor/viewer roles). Ensure the implementation is secure and follows best practices.

Features:
- Create vouchers on pfsense
- List vouchers
- Enable/disable vouchers
- Delete vouchers
- Attach metadata (guest name, rooms, etc) to vouchers for record keeping
- Print all of this information to a configurable print job for regular A4 paper.