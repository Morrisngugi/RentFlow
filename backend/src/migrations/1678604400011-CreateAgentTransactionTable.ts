import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateAgentTransactionTable1678604400011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'agent_transactions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          {
            name: 'agentId',
            type: 'uuid',
          },
          {
            name: 'actionType',
            type: 'enum',
            enum: [
              'property_created',
              'property_updated',
              'landlord_linked',
              'tenant_assigned',
              'invoice_generated',
              'invoice_updated',
              'payment_processed',
              'lease_created'
            ],
          },
          { name: 'relatedEntityId', type: 'uuid', isNullable: true },
          { name: 'relatedEntityType', type: 'varchar', isNullable: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['agentId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'CASCADE',
          }),
        ],
        indices: [
          {
            columnNames: ['agentId'],
          },
          {
            columnNames: ['createdAt'],
          },
          {
            columnNames: ['actionType'],
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('agent_transactions', true);
  }
}
