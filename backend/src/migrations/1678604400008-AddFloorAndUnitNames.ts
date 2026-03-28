import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFloorAndUnitNames1678604400008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add floorName column to property_floors table
    if (
      !(await queryRunner.hasColumn('property_floors', 'floorName'))
    ) {
      await queryRunner.addColumn(
        'property_floors',
        new TableColumn({
          name: 'floorName',
          type: 'varchar',
          isNullable: true,
        })
      );
    }

    // Add unitName column to property_units table
    if (
      !(await queryRunner.hasColumn('property_units', 'unitName'))
    ) {
      await queryRunner.addColumn(
        'property_units',
        new TableColumn({
          name: 'unitName',
          type: 'varchar',
          isNullable: true,
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('property_floors', 'floorName');
    await queryRunner.dropColumn('property_units', 'unitName');
  }
}
