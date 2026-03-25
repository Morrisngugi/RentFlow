import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPropertyModel1678604400002 implements MigrationInterface {
  name = 'AddPropertyModel1678604400002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add propertyModel column
    await queryRunner.addColumn(
      'properties',
      new TableColumn({
        name: 'propertyModel',
        type: 'enum',
        enum: ['rental', 'airbnb'],
        default: "'rental'",
        isNullable: false,
      })
    );

    // Add securityFee column
    await queryRunner.addColumn(
      'properties',
      new TableColumn({
        name: 'securityFee',
        type: 'numeric',
        isNullable: true,
        default: null,
      })
    );

    // Create property_room_type_pricing table if it doesn't exist
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "property_room_type_pricing" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "propertyId" uuid NOT NULL,
        "roomType" varchar NOT NULL,
        "billingFrequency" varchar NOT NULL DEFAULT 'monthly',
        "price" numeric NOT NULL,
        "garbageAmount" numeric,
        "waterUnitCost" numeric,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE,
        UNIQUE ("propertyId", "roomType")
      )
    `);

    // Create index for foreign key
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_property_room_type_pricing_propertyId" 
      ON "property_room_type_pricing"("propertyId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the index first
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_property_room_type_pricing_propertyId"`
    );

    // Drop the table
    await queryRunner.query(`DROP TABLE IF EXISTS "property_room_type_pricing"`);

    // Drop columns
    await queryRunner.dropColumn('properties', 'securityFee');
    await queryRunner.dropColumn('properties', 'propertyModel');
  }
}
