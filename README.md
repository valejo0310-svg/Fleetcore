# FleetCore API
Coder : Valery Avila
clan: node - nest am



REST API for fleet maintenance management, built with **NestJS, TypeScript, PostgreSQL, TypeORM, and Docker**.

## Features

- JWT authentication and role-based access control (`ADMIN` and `TECHNICIAN`).
- Vehicle, mechanic, and workshop management.
- Preventive and corrective maintenance scheduling.
- Maintenance lifecycle: `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, and `CANCELLED`.
- Mileage validation and scheduling conflict prevention.
- Database transactions and resource locking.
- DTO validation, standardized HTTP responses, and error handling.
- API key protection for external access.
- Swagger API documentation.

## Getting Started

Create a `.env` file with the required PostgreSQL, JWT, API key, and seed configuration.

Start the application:

```bash
docker compose up -d --build
```

Swagger documentation:

**http://localhost:3000/api**

## Database

The database backup `fleetcore_backup_pg15.sql` contains the PostgreSQL schema and sample records.

To restore it into an empty database:

```bash
docker cp fleetcore_backup_pg15.sql fleetcore-db-1:/tmp/fleetcore.sql
docker compose exec db psql -X -v ON_ERROR_STOP=1 -U postgres -d fleetcore -f /tmp/fleetcore.sql
```

Alternatively, populate an initialized database with sample data:

```bash
docker compose exec app npm run seed
```

The seed operation is designed to be idempotent.

## Test Accounts

| Role | Email |
|---|---|
| ADMIN | admin@fleetcore.local |
| TECHNICIAN | technician1@fleetcore.local |
| TECHNICIAN | technician2@fleetcore.local |

For newly seeded accounts, passwords are configured through the `SEED_PASSWORD` environment variable. Restored accounts retain their existing password hashes.

## Testing

Build the project:

```bash
npm run build
```

Run unit tests:

```bash
npm run test
```

Run end-to-end tests inside Docker:

```bash
docker compose exec app npm run test:e2e
```

## Project Structure

```text
src/
├── auth/
├── users/
├── vehicles/
├── mechanics/
├── workshops/
├── maintenances/
├── common/
├── seed.ts
├── app.module.ts
└── main.ts
```

The application follows a modular architecture using controllers, services,