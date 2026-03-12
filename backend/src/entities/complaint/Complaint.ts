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
import { ComplaintAttachment } from './ComplaintAttachment';

@Entity('complaints')
export class Complaint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  leaseId: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  landlordId: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ['maintenance', 'billing', 'safety', 'noise', 'other'],
    nullable: true,
  })
  complaintType: string;

  @Column({
    type: 'enum',
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
  })
  status: string;

  @Column({ type: 'simple-array', nullable: true })
  attachmentUrls: string[];

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Lease)
  lease: Lease;

  @ManyToOne(() => User)
  tenant: User;

  @ManyToOne(() => User)
  landlord: User;

  @OneToMany(() => ComplaintAttachment, (attachment) => attachment.complaint, {
    cascade: true,
  })
  attachments: ComplaintAttachment[];
}
