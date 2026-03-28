import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeMonthlyRentNullable1678604400003 implements MigrationInterface {
  name = 'MakeMonthlyRentNullable1678604400003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make monthlyRent nullable
    await queryRunner.query(`
      ALTER TABLE "properties" 
      ALTER COLUMN "monthlyRent" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert back to NOT NULL (with default 0 for existing rows)
    await queryRunner.query(`
      UPDATE "properties" SET "monthlyRent" = 0 WHERE "monthlyRent" IS NULL
    `);
    
    await queryRunner.query(`
      ALTER TABLE "properties" 
      ALTER COLUMN "monthlyRent" SET NOT NULL
    `);
  }
}
