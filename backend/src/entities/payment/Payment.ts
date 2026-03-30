import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Lease } from '../lease/Lease';
import { User } from '../User';
import { LateFee } from './LateFee';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid' })
  leaseId!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'uuid' })
  landlordId!: string;

  @Column({ type: 'numeric' })
  amount!: number;

  @Column({ type: 'numeric' })
  amountDue!: number;

  @Column({
    type: 'enum',
    enum: ['stripe', 'bank_transfer', 'cash', 'check'],
    nullable: true,
  })
  paymentMethod!: string;

  @Column({ type: 'varchar', nullable: true })
  stripePaymentIntentId!: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  })
  status!: string;

  @Column({ type: 'date' })
  dueDate!: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidDate!: Date;

  @CreateDateColumn() createdAt!: Date;

  @UpdateDateColumn() updatedAt!: Date;

  // Relations
  @ManyToOne(() => Lease, (lease) => lease.payments)
  lease!: Lease;

  @ManyToOne(() => User)
  tenant!: User;

  @ManyToOne(() => User)
  landlord!: User;

  @OneToMany(() => LateFee, (fee) => fee.payment)
  lateFees!: LateFee[];
    transactionDate: any;
}

