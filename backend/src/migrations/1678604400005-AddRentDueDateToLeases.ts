import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRentDueDateToLeases1678604400005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "leases" ADD "rentDueDate" date`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "leases" DROP COLUMN "rentDueDate"`
    );
  }
}
