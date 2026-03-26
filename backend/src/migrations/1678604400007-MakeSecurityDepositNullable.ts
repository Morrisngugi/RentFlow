import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeSecurityDepositNullable1678604400007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "leases" ALTER COLUMN "securityDeposit" DROP NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "leases" ALTER COLUMN "securityDeposit" SET NOT NULL, SET DEFAULT 0`
    );
  }
}
