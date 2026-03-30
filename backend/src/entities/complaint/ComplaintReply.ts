import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Complaint } from './Complaint';
import { User } from '../User';

@Entity('complaint_replies')
export class ComplaintReply {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid' })
  complaintId!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'simple-array', nullable: true })
  attachmentUrls!: string[];

  @CreateDateColumn() createdAt!: Date;

  @UpdateDateColumn() updatedAt!: Date;

  // Relations
  @ManyToOne(() => Complaint)
  complaint!: Complaint;

  @ManyToOne(() => User)
  user!: User;
}
