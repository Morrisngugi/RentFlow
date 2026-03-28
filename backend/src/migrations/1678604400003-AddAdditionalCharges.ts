import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAdditionalCharges1678604400003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'monthly_rent_breakdown',
      new TableColumn({
        name: 'penaltyCharges',
        type: 'numeric',
        precision: 12,
        scale: 2,
        default: 0,
        isNullable: false,
      })
    );

    await queryRunner.addColumn(
      'monthly_rent_breakdown',
      new TableColumn({
        name: 'electricityReconnectionFee',
        type: 'numeric',
        precision: 12,
        scale: 2,
        default: 0,
        isNullable: false,
      })
    );

    await queryRunner.addColumn(
      'monthly_rent_breakdown',
      new TableColumn({
        name: 'waterReconnectionFee',
        type: 'numeric',
        precision: 12,
        scale: 2,
        default: 0,
        isNullable: false,
      })
    );

    await queryRunner.addColumn(
      'monthly_rent_breakdown',
      new TableColumn({
        name: 'otherCharges',
        type: 'numeric',
        precision: 12,
        scale: 2,
        default: 0,
        isNullable: false,
      })
    );

    await queryRunner.addColumn(
      'monthly_rent_breakdown',
      new TableColumn({
        name: 'additionalChargesDescription',
        type: 'text',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('monthly_rent_breakdown', 'penaltyCharges');
    await queryRunner.dropColumn('monthly_rent_breakdown', 'electricityReconnectionFee');
    await queryRunner.dropColumn('monthly_rent_breakdown', 'waterReconnectionFee');
    await queryRunner.dropColumn('monthly_rent_breakdown', 'otherCharges');
    await queryRunner.dropColumn('monthly_rent_breakdown', 'additionalChargesDescription');
  }
}
