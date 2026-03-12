import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Lease } from '../lease/Lease';
import { User } from '../User';

@Entity('deposits')
export class Deposit {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid' })
  leaseId!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'uuid' })
  landlordId!: string;

  @Column({ type: 'numeric' })
  amount!: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'held', 'released', 'forfeited'],
    default: 'pending',
  })
  status!: string;

  @Column({ type: 'date', nullable: true })
  collectedDate!: Date;

  @Column({ type: 'date', nullable: true })
  releasedDate!: Date;

  @Column({ type: 'text', nullable: true })
  notes!: string;

  @CreateDateColumn() createdAt!: Date;

  @UpdateDateColumn() updatedAt!: Date;

  // Relations
  @ManyToOne(() => Lease)
  lease!: Lease;

  @ManyToOne(() => User)
  tenant!: User;

  @ManyToOne(() => User)
  landlord!: User;
}

