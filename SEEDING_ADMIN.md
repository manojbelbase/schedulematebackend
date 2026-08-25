# Production Admin Seeding

## Option 1: Environment Variables (Recommended)

Set these in your production environment:

```bash
BACKOFFICE_EMAIL=admin@yourdomain.com
BACKOFFICE_PASSWORD=secure-random-password-here
BACKOFFICE_NAME="Backoffice Admin"
```

Run this once after deployment:

```bash
pnpm tsx src/scripts/seed-backoffice-prod.ts
```

## Option 2: One-time CLI Script (Interactive)

```bash
pnpm tsx src/scripts/create-admin.ts
# Prompts for email, password, name securely
```

## Option 3: Database Migration (For initial setup)

Create a migration that inserts the admin user:

```sql
INSERT INTO users (email, name, password, role)
VALUES ('admin@yourdomain.com', 'Admin', '$scrypt$hash...', 'admin');
```

## Security Notes

- **Never commit credentials to git**
- Use strong, randomly generated passwords (32+ chars)
- Rotate credentials periodically
- Consider using a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
- The seed script should only run once in production
