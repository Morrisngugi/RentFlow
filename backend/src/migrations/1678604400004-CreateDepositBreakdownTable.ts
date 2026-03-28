import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateDepositBreakdownTable1678604400004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'deposit_breakdowns',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'leaseId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'rentDeposit',
            type: 'numeric',
            default: 0,
            precision: 12,
            scale: 2,
          },
          {
            name: 'waterDeposit',
            type: 'numeric',
            default: 0,
            isNullable: true,
            precision: 12,
            scale: 2,
          },
          {
            name: 'electricityDeposit',
            type: 'numeric',
            default: 0,
            isNullable: true,
            precision: 12,
            scale: 2,
          },
          {
            name: 'otherDeposit',
            type: 'numeric',
            default: 0,
            isNullable: true,
            precision: 12,
            scale: 2,
          },
          {
            name: 'otherDepositDescription',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['leaseId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'leases',
            onDelete: 'CASCADE',
          },
        ],
        indices: [
          {
            columnNames: ['leaseId'],
            isUnique: true,
          },
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('deposit_breakdowns');
  }
}
