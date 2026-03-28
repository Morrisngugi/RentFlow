import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Lease } from './Lease';

@Entity('deposit_breakdowns')
export class DepositBreakdown {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid' })
  leaseId!: string;

  @Column({ type: 'numeric', default: 0 })
  rentDeposit!: number;

  @Column({ type: 'numeric', default: 0, nullable: true })
  waterDeposit!: number;

  @Column({ type: 'numeric', default: 0, nullable: true })
  electricityDeposit!: number;

  @Column({ type: 'numeric', default: 0, nullable: true })
  otherDeposit!: number;

  @Column({ type: 'text', nullable: true })
  otherDepositDescription!: string;

  @Column({ type: 'numeric', generatedType: 'STORED', asExpression: 'COALESCE("rentDeposit", 0) + COALESCE("waterDeposit", 0) + COALESCE("electricityDeposit", 0) + COALESCE("otherDeposit", 0)' })
  totalDeposit!: number;

  @CreateDateColumn() createdAt!: Date;

  @UpdateDateColumn() updatedAt!: Date;

  // Relations
  @OneToOne(() => Lease, (lease) => lease.depositBreakdown)
  @JoinColumn()
  lease!: Lease;
}
