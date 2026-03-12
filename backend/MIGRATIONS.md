# RentFlow Backend Migrations

Incremental database migrations for PostgreSQL using TypeORM.

## Overview

Migrations are timestamped, isolated SQL changes that can be applied sequentially. Each migration includes an `up()` method to apply changes and a `down()` method to revert them.

## Available Commands

### Run Pending Migrations
```bash
npm run db:migrate
```

Applies all migrations that haven't been executed yet. Safe to run multiple times - already-applied migrations won't run again.

### Reset Database
```bash
npm run db:reset
```

Reverts the last migration and re-applies all migrations. Use for development when fixing migration issues.

### Generate New Migration
```bash
npm run migration:generate -- -n <MigrationName>
```

Example:
```bash
npm run migration:generate -- -n AddUserRoleColumn
```

This will create a new migration file in `src/migrations/` with the format: `{timestamp}-{MigrationName}.ts`

## Migration Files

All migrations are stored in `src/migrations/` with timestamps in the filename:

```
src/migrations/
├── 1678604400000-InitialSchema.ts      # Initial database setup
├── 1678605000000-AddUserRole.ts        # Future migration
└── 1678605600000-AddPaymentGateway.ts  # Future migration
```

## How Migrations Work

### TypeORM keeps track of executed migrations in `typeorm_metadata` table:
- Prevents duplicate execution
- Maintains version history
- Allows selective rollback

### Each migration has two methods:

```typescript
export class AddFeatureName1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Apply changes - run when migrating up
    await queryRunner.query(`ALTER TABLE ...`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Undo changes - run when reverting
    await queryRunner.query(`ALTER TABLE ...`);
  }
}
```

## Current Migrations

### 1678604400000-InitialSchema
**Purpose**: Create all core database tables and relationships  
**Tables Created**: 17 tables
- Users & Profiles (4 tables)
- Properties & Images (2 tables)
- Leases & Renewals (3 tables)
- Payments & Deposit (3 tables)
- Complaints (2 tables)
- Notifications (2 tables)
- Assignments (1 table)

**Status**: Ready to apply
**Command**: `npm run db:migrate`

## Creating Future Migrations

### Scenario 1: Add a New Column
```bash
npm run migration:generate -- -n AddPhoneNumberToUser
```

Edit the generated file:
```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(
    `ALTER TABLE "users" ADD COLUMN "mobileNumber" varchar`
  );
}

public async down(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(
    `ALTER TABLE "users" DROP COLUMN "mobileNumber"`
  );
}
```

### Scenario 2: Create New Table
```bash
npm run migration:generate -- -n CreateAuditLog
```

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.createTable(new Table({
    name: 'audit_logs',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true },
      { name: 'action', type: 'varchar' },
      { name: 'userId', type: 'uuid' },
      { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
    ]
  }));
}

public async down(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.dropTable('audit_logs');
}
```

## Docker Deployment

When deploying to Docker, migrations run automatically:

```bash
# In docker-compose.yml, backend service includes:
docker-compose up  # Migrations run during startup
```

To manually run migrations in Docker:
```bash
docker-compose exec backend npm run db:migrate
```

## Troubleshooting

### Stuck Migration
If a migration fails midway:
1. Check `typeorm_metadata` table
2. Manually fix the database state
3. Delete the failed migration record: `DELETE FROM typeorm_metadata WHERE type='migration' AND name='...'`
4. Fix the migration file
5. Run `npm run db:migrate` again

### Undo Last Migration
```bash
npm run migration:revert
```

### Check Migration Status
```bash
# See all migrations in the codebase
ls src/migrations/

# See applied migrations in the database
npm run db:migrate -- --list
```

## Best Practices

✅ **Do:**
- Write atomic migrations (one concern per migration)
- Test `up()` and `down()` methods
- Include data transformations if needed
- Document complex migrations with comments
- Make migrations idempotent (safe to run multiple times)

❌ **Don't:**
- Combine multiple unrelated changes
- Drop tables in production migrations (use soft deletes instead)
- Skip the `down()` method
- Migrate without backups in production

## Week 1-2 Roadmap

**Day 1**: ✅ InitialSchema migration created and ready  
**Day 2**: Apply migrations + Auth implementation  
**Day 3-4**: Property & Lease API endpoints  
**Day 5**: Payment processing migrations  
**Week 2**: Additional feature migrations as needed

## Resources

- [TypeORM Migrations Guide](https://typeorm.io/migrations)
- [PostgreSQL Migrations Workflow](https://www.postgresql.org/docs/)
- RentFlow Database Schema: See `TYPEORM_ENTITIES.md` in project root
