import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './User';

@Entity('agent_transactions')
export class AgentTransaction {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid' })
  agentId!: string;

  @Column({
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
  })
  actionType!: string;

  @Column({ type: 'uuid', nullable: true })
  relatedEntityId!: string;

  @Column({ type: 'varchar', nullable: true })
  relatedEntityType!: string; // e.g., 'lease', 'property', 'tenant', 'invoice'

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: any; // Additional context (e.g., amounts, counts, changes)

  @CreateDateColumn() createdAt!: Date;

  // Relation
  @ManyToOne(() => User)
  agent!: User;
}
