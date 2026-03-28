import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPaymentDetailsToProperties1678604400009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add paymentMethod column to properties table
    if (
      !(await queryRunner.hasColumn('properties', 'paymentMethod'))
    ) {
      await queryRunner.addColumn(
        'properties',
        new TableColumn({
          name: 'paymentMethod',
          type: 'enum',
          enum: ['bank', 'paybill'],
          isNullable: true,
        })
      );
    }

    // Add bankName column to properties table
    if (
      !(await queryRunner.hasColumn('properties', 'bankName'))
    ) {
      await queryRunner.addColumn(
        'properties',
        new TableColumn({
          name: 'bankName',
          type: 'varchar',
          isNullable: true,
        })
      );
    }

    // Add accountNumber column to properties table
    if (
      !(await queryRunner.hasColumn('properties', 'accountNumber'))
    ) {
      await queryRunner.addColumn(
        'properties',
        new TableColumn({
          name: 'accountNumber',
          type: 'varchar',
          isNullable: true,
        })
      );
    }

    // Add paybillNumber column to properties table
    if (
      !(await queryRunner.hasColumn('properties', 'paybillNumber'))
    ) {
      await queryRunner.addColumn(
        'properties',
        new TableColumn({
          name: 'paybillNumber',
          type: 'varchar',
          isNullable: true,
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('properties', 'paybillNumber');
    await queryRunner.dropColumn('properties', 'accountNumber');
    await queryRunner.dropColumn('properties', 'bankName');
    await queryRunner.dropColumn('properties', 'paymentMethod');
  }
}
