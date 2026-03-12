import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from './User';

@Entity('agent_landlord_assignments')
@Unique(['agentId', 'landlordId'])
export class AgentLandlordAssignment {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid' })
  agentId!: string;

  @Column({ type: 'uuid' })
  landlordId!: string;

  @CreateDateColumn() assignedAt!: Date;

  // Relations
  @ManyToOne(() => User)
  agent!: User;

  @ManyToOne(() => User)
  landlord!: User;
}

