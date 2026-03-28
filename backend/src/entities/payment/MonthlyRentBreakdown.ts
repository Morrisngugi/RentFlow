import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Lease } from '../lease/Lease';

@Entity('monthly_rent_breakdown')
@Unique(['leaseId', 'month', 'year'])
export class MonthlyRentBreakdown {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid' })
  leaseId!: string;

  @Column({ type: 'int' })
  month!: number; // 1-12

  @Column({ type: 'int' })
  year!: number; // e.g., 2026

  @Column({ type: 'numeric' })
  baseRent!: number; // Fixed monthly rent

  @Column({ type: 'numeric', default: 0 })
  waterCharges!: number; // Units used × water unit cost

  @Column({ type: 'numeric', default: 0 })
  garbageCharges!: number; // Monthly garbage fee

  @Column({ type: 'numeric', default: 0 })
  securityFee!: number; // Monthly security fee

  @Column({ type: 'numeric' })
  totalDue!: number; // baseRent + waterCharges + garbageCharges + securityFee

  @Column({ type: 'numeric', default: 0 })
  amountPaid!: number; // Total payments received for this month

  @Column({ type: 'numeric', default: 0 })
  overpayment!: number; // Positive if paid > due, negative if underpaid

  @Column({
    type: 'enum',
    enum: ['pending', 'partial', 'paid', 'overpaid'],
    default: 'pending',
  })
  status!: string; // pending, partial, paid, overpaid

  @Column({ type: 'date', nullable: true })
  dueDate!: Date;

  @Column({ type: 'text', nullable: true })
  notes!: string;

  @CreateDateColumn() createdAt!: Date;

  @UpdateDateColumn() updatedAt!: Date;

  // Relations
  @ManyToOne(() => Lease)
  lease!: Lease;
}
