import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSecurityFeeToLeases1678604400006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "leases" ADD "securityFee" numeric DEFAULT 0`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "leases" DROP COLUMN "securityFee"`
    );
  }
}
