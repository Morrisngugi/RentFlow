import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class InitialSchema1678604400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // 1. USERS TABLE
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'email', type: 'varchar', isUnique: true, isNullable: true },
          { name: 'phoneNumber', type: 'varchar' },
          { name: 'firstName', type: 'varchar' },
          { name: 'lastName', type: 'varchar' },
          { name: 'idNumber', type: 'varchar' },
          { name: 'profilePictureUrl', type: 'varchar', isNullable: true },
          { name: 'passwordHash', type: 'varchar' },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    // ============================================
    // 2. PROFILE TABLES
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'tenant_profiles',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'userId', type: 'uuid' },
          { name: 'nationality', type: 'varchar', isNullable: true },
          { name: 'maritalStatus', type: 'enum', enum: ['single', 'married', 'divorced', 'widowed'], isNullable: true },
          { name: 'numberOfChildren', type: 'int', default: 0 },
          { name: 'occupation', type: 'varchar', isNullable: true },
          { name: 'postalAddress', type: 'text', isNullable: true },
          { name: 'nextOfKinName', type: 'varchar', isNullable: true },
          { name: 'nextOfKinPhone', type: 'varchar', isNullable: true },
          { name: 'nextOfKinRelationship', type: 'varchar', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'tenant_profiles',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createTable(
      new Table({
        name: 'agent_profiles',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'userId', type: 'uuid' },
          { name: 'officeName', type: 'varchar' },
          { name: 'officeLocation', type: 'varchar' },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'agent_profiles',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createTable(
      new Table({
        name: 'landlord_profiles',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'userId', type: 'uuid' },
          { name: 'physicalAddress', type: 'text' },
          { name: 'bankName', type: 'varchar', isNullable: true },
          { name: 'bankAccountNumber', type: 'varchar', isNullable: true },
          { name: 'bankAccountHolder', type: 'varchar', isNullable: true },
          { name: 'companyName', type: 'varchar', isNullable: true },
          { name: 'taxId', type: 'varchar', isNullable: true },
          { name: 'defaultLateFeePercentage', type: 'numeric', default: 5.0 },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'landlord_profiles',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // ============================================
    // 3. AGENT-LANDLORD ASSIGNMENT
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'agent_landlord_assignments',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'agentId', type: 'uuid' },
          { name: 'landlordId', type: 'uuid' },
          { name: 'assignedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
        uniques: [
          { columnNames: ['agentId', 'landlordId'] },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'agent_landlord_assignments',
      new TableForeignKey({
        columnNames: ['agentId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'agent_landlord_assignments',
      new TableForeignKey({
        columnNames: ['landlordId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // ============================================
    // 4. PROPERTIES TABLE
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'properties',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'landlordId', type: 'uuid' },
          { name: 'name', type: 'varchar' },
          { name: 'address', type: 'text' },
          { name: 'city', type: 'varchar' },
          { name: 'postalCode', type: 'varchar', isNullable: true },
          { name: 'country', type: 'varchar', default: 'Kenya' },
          { name: 'bedrooms', type: 'int', isNullable: true },
          { name: 'bathrooms', type: 'int', isNullable: true },
          { name: 'sqft', type: 'int', isNullable: true },
          { name: 'propertyType', type: 'enum', enum: ['apartment', 'house', 'commercial'], isNullable: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'monthlyRent', type: 'numeric' },
          { name: 'depositAmount', type: 'numeric', isNullable: true },
          { name: 'utilitiesIncluded', type: 'text', isNullable: true },
          { name: 'imageUrls', type: 'text', isNullable: true },
          { name: 'isAvailable', type: 'boolean', default: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'properties',
      new TableForeignKey({
        columnNames: ['landlordId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // ============================================
    // 5. PROPERTY IMAGES
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'property_images',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'propertyId', type: 'uuid' },
          { name: 'imageUrl', type: 'varchar' },
          { name: 'caption', type: 'varchar', isNullable: true },
          { name: 'displayOrder', type: 'int', default: 0 },
          { name: 'uploadedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'property_images',
      new TableForeignKey({
        columnNames: ['propertyId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'properties',
        onDelete: 'CASCADE',
      })
    );

    // ============================================
    // 6. LEASE TERMS
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'lease_terms',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'name', type: 'varchar' },
          { name: 'durationMonths', type: 'int', isNullable: true },
          { name: 'autoRenewal', type: 'boolean', default: false },
          { name: 'noticePeriodDays', type: 'int', default: 30 },
        ],
      }),
      true
    );

    // ============================================
    // 7. LEASES
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'leases',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'propertyId', type: 'uuid' },
          { name: 'tenantId', type: 'uuid' },
          { name: 'landlordId', type: 'uuid' },
          { name: 'leaseTermId', type: 'uuid' },
          { name: 'monthlyRent', type: 'numeric' },
          { name: 'garbageAmount', type: 'numeric', default: 0 },
          { name: 'waterUnitCost', type: 'numeric', default: 0 },
          { name: 'securityDeposit', type: 'numeric', default: 0 },
          { name: 'depositPaid', type: 'boolean', default: false },
          { name: 'depositPaidDate', type: 'date', isNullable: true },
          { name: 'startDate', type: 'date' },
          { name: 'endDate', type: 'date' },
          { name: 'status', type: 'enum', enum: ['draft', 'active', 'expired', 'terminated'], default: 'active' },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'leases',
      new TableForeignKey({
        columnNames: ['propertyId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'properties',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'leases',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'leases',
      new TableForeignKey({
        columnNames: ['landlordId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'leases',
      new TableForeignKey({
        columnNames: ['leaseTermId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'lease_terms',
        onDelete: 'SET NULL',
      })
    );

    // ============================================
    // 8. LEASE RENEWALS
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'lease_renewals',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'leaseId', type: 'uuid' },
          { name: 'oldEndDate', type: 'date' },
          { name: 'newEndDate', type: 'date' },
          { name: 'newMonthlyRent', type: 'numeric', isNullable: true },
          { name: 'renewalDate', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'lease_renewals',
      new TableForeignKey({
        columnNames: ['leaseId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'leases',
        onDelete: 'CASCADE',
      })
    );

    // ============================================
    // 9. RENT SCHEDULES
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'rent_schedules',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'leaseId', type: 'uuid' },
          { name: 'rentDueDay', type: 'int' },
          { name: 'dueDate', type: 'date' },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'rent_schedules',
      new TableForeignKey({
        columnNames: ['leaseId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'leases',
        onDelete: 'CASCADE',
      })
    );

    // ============================================
    // 10. PAYMENTS
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'leaseId', type: 'uuid' },
          { name: 'tenantId', type: 'uuid' },
          { name: 'landlordId', type: 'uuid' },
          { name: 'amount', type: 'numeric' },
          { name: 'amountDue', type: 'numeric' },
          { name: 'paymentMethod', type: 'enum', enum: ['stripe', 'bank_transfer', 'cash', 'check'], isNullable: true },
          { name: 'stripePaymentIntentId', type: 'varchar', isNullable: true },
          { name: 'status', type: 'enum', enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
          { name: 'dueDate', type: 'date' },
          { name: 'paidDate', type: 'timestamp', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['leaseId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'leases',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['landlordId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // ============================================
    // 11. DEPOSITS
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'deposits',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'leaseId', type: 'uuid' },
          { name: 'tenantId', type: 'uuid' },
          { name: 'landlordId', type: 'uuid' },
          { name: 'amount', type: 'numeric' },
          { name: 'status', type: 'enum', enum: ['pending', 'held', 'released', 'forfeited'], default: 'pending' },
          { name: 'collectedDate', type: 'date', isNullable: true },
          { name: 'releasedDate', type: 'date', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'deposits',
      new TableForeignKey({
        columnNames: ['leaseId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'leases',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'deposits',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'deposits',
      new TableForeignKey({
        columnNames: ['landlordId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // ============================================
    // 12. LATE FEES
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'late_fees',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'paymentId', type: 'uuid' },
          { name: 'leaseId', type: 'uuid' },
          { name: 'daysOverdue', type: 'int' },
          { name: 'feeAmount', type: 'numeric' },
          { name: 'feePercentage', type: 'numeric', isNullable: true },
          { name: 'status', type: 'enum', enum: ['pending', 'paid', 'waived'], default: 'pending' },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'late_fees',
      new TableForeignKey({
        columnNames: ['paymentId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'payments',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'late_fees',
      new TableForeignKey({
        columnNames: ['leaseId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'leases',
        onDelete: 'CASCADE',
      })
    );

    // ============================================
    // 13. COMPLAINTS
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'complaints',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'leaseId', type: 'uuid' },
          { name: 'tenantId', type: 'uuid' },
          { name: 'landlordId', type: 'uuid' },
          { name: 'title', type: 'varchar' },
          { name: 'description', type: 'text' },
          { name: 'complaintType', type: 'enum', enum: ['maintenance', 'billing', 'safety', 'noise', 'other'], isNullable: true },
          { name: 'status', type: 'enum', enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
          { name: 'attachmentUrls', type: 'text', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'resolvedAt', type: 'timestamp', isNullable: true },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'complaints',
      new TableForeignKey({
        columnNames: ['leaseId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'leases',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'complaints',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'complaints',
      new TableForeignKey({
        columnNames: ['landlordId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // ============================================
    // 14. COMPLAINT ATTACHMENTS
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'complaint_attachments',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'complaintId', type: 'uuid' },
          { name: 'fileUrl', type: 'varchar' },
          { name: 'fileName', type: 'varchar', isNullable: true },
          { name: 'fileType', type: 'varchar', isNullable: true },
          { name: 'uploadedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'complaint_attachments',
      new TableForeignKey({
        columnNames: ['complaintId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'complaints',
        onDelete: 'CASCADE',
      })
    );

    // ============================================
    // 15. NOTIFICATIONS
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'notifications',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'userId', type: 'uuid' },
          { name: 'title', type: 'varchar' },
          { name: 'message', type: 'text' },
          { name: 'notificationType', type: 'varchar', isNullable: true },
          { name: 'relatedEntityType', type: 'varchar', isNullable: true },
          { name: 'relatedEntityId', type: 'uuid', isNullable: true },
          { name: 'isRead', type: 'boolean', default: false },
          { name: 'readAt', type: 'timestamp', isNullable: true },
          { name: 'smsSent', type: 'boolean', default: false },
          { name: 'emailSent', type: 'boolean', default: false },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'notifications',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // ============================================
    // 16. NOTIFICATION PREFERENCES
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'notification_preferences',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'userId', type: 'uuid', isUnique: true },
          { name: 'emailEnabled', type: 'boolean', default: true },
          { name: 'smsEnabled', type: 'boolean', default: true },
          { name: 'inAppEnabled', type: 'boolean', default: true },
          { name: 'notifyRentDue', type: 'boolean', default: true },
          { name: 'notifyLatePayment', type: 'boolean', default: true },
          { name: 'notifyLeaseExpiry', type: 'boolean', default: true },
          { name: 'notifyComplaints', type: 'boolean', default: true },
          { name: 'notifyPaymentReceived', type: 'boolean', default: true },
          { name: 'preferredPhone', type: 'varchar', isNullable: true },
          { name: 'preferredEmail', type: 'varchar', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'notification_preferences',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // ============================================
    // CREATE INDEXES FOR PERFORMANCE
    // ============================================
    await queryRunner.createIndex('users', new TableIndex({ columnNames: ['email'] }));
    await queryRunner.createIndex('properties', new TableIndex({ columnNames: ['landlordId'] }));
    await queryRunner.createIndex('leases', new TableIndex({ columnNames: ['propertyId'] }));
    await queryRunner.createIndex('leases', new TableIndex({ columnNames: ['tenantId'] }));
    await queryRunner.createIndex('leases', new TableIndex({ columnNames: ['landlordId'] }));
    await queryRunner.createIndex('payments', new TableIndex({ columnNames: ['leaseId'] }));
    await queryRunner.createIndex('payments', new TableIndex({ columnNames: ['tenantId'] }));
    await queryRunner.createIndex('payments', new TableIndex({ columnNames: ['status'] }));
    await queryRunner.createIndex('complaints', new TableIndex({ columnNames: ['leaseId'] }));
    await queryRunner.createIndex('complaints', new TableIndex({ columnNames: ['status'] }));
    await queryRunner.createIndex('notifications', new TableIndex({ columnNames: ['userId'] }));
    await queryRunner.createIndex('notifications', new TableIndex({ columnNames: ['isRead'] }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse order (children before parents)
    const tables = [
      'notification_preferences',
      'notifications',
      'complaint_attachments',
      'complaints',
      'late_fees',
      'deposits',
      'payments',
      'rent_schedules',
      'lease_renewals',
      'leases',
      'lease_terms',
      'property_images',
      'properties',
      'agent_landlord_assignments',
      'landlord_profiles',
      'agent_profiles',
      'tenant_profiles',
      'users',
    ];

    for (const table of tables) {
      await queryRunner.dropTable(table, true);
    }
  }
}
