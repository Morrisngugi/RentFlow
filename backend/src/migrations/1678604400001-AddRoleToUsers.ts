import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRoleToUsers1678604400001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the column already exists
    const table = await queryRunner.getTable('users');
    const roleColumnExists = table?.columns.some(col => col.name === 'role');

    if (!roleColumnExists) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'role',
          type: 'enum',
          enum: ['admin', 'agent', 'landlord', 'tenant'],
          default: "'tenant'",
          isNullable: false,
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    const roleColumn = table?.columns.find(col => col.name === 'role');

    if (roleColumn) {
      await queryRunner.dropColumn('users', 'role');
    }
  }
}
