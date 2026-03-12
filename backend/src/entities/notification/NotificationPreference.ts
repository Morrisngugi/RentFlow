import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../User';

@Entity('notification_preferences')
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'boolean', default: true })
  emailEnabled!: boolean;

  @Column({ type: 'boolean', default: true })
  smsEnabled!: boolean;

  @Column({ type: 'boolean', default: true })
  inAppEnabled!: boolean;

  @Column({ type: 'boolean', default: true })
  notifyRentDue!: boolean;

  @Column({ type: 'boolean', default: true })
  notifyLatePayment!: boolean;

  @Column({ type: 'boolean', default: true })
  notifyLeaseExpiry!: boolean;

  @Column({ type: 'boolean', default: true })
  notifyComplaints!: boolean;

  @Column({ type: 'boolean', default: true })
  notifyPaymentReceived!: boolean;

  @Column({ type: 'varchar', nullable: true })
  preferredPhone!: string;

  @Column({ type: 'varchar', nullable: true })
  preferredEmail!: string;

  @CreateDateColumn() createdAt!: Date;

  @UpdateDateColumn() updatedAt!: Date;

  // Relation
  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;
}

