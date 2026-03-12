import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Payment } from './Payment';
import { Lease } from '../lease/Lease';

@Entity('late_fees')
export class LateFee {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid' })
  paymentId!: string;

  @Column({ type: 'uuid' })
  leaseId!: string;

  @Column({ type: 'int' })
  daysOverdue!: number;

  @Column({ type: 'numeric' })
  feeAmount!: number;

  @Column({ type: 'numeric', nullable: true })
  feePercentage!: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'paid', 'waived'],
    default: 'pending',
  })
  status!: string;

  @CreateDateColumn() createdAt!: Date;

  // Relations
  @ManyToOne(() => Payment, (payment) => payment.lateFees)
  payment!: Payment;

  @ManyToOne(() => Lease)
  lease!: Lease;
}

