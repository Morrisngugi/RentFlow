import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateMonthlyRentBreakdownTable1678604400010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'monthly_rent_breakdown',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'leaseId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'month',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'year',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'baseRent',
            type: 'numeric',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'waterCharges',
            type: 'numeric',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'garbageCharges',
            type: 'numeric',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'securityFee',
            type: 'numeric',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'totalDue',
            type: 'numeric',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'amountPaid',
            type: 'numeric',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'overpayment',
            type: 'numeric',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'partial', 'paid', 'overpaid'],
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'dueDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Add foreign key
    await queryRunner.createForeignKey(
      'monthly_rent_breakdown',
      new TableForeignKey({
        columnNames: ['leaseId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'leases',
        onDelete: 'CASCADE',
      })
    );

    // Add unique constraint on leaseId, month, year
    await queryRunner.createIndex(
      'monthly_rent_breakdown',
      new TableIndex({
        name: 'idx_monthly_rent_breakdown_lease_month_year',
        columnNames: ['leaseId', 'month', 'year'],
        isUnique: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('monthly_rent_breakdown');
  }
}
