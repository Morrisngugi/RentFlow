import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Complaint } from './Complaint';

@Entity('complaint_attachments')
export class ComplaintAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  complaintId: string;

  @Column({ type: 'varchar' })
  fileUrl: string;

  @Column({ type: 'varchar', nullable: true })
  fileName: string;

  @Column({ type: 'varchar', nullable: true })
  fileType: string;

  @CreateDateColumn()
  uploadedAt: Date;

  // Relation
  @ManyToOne(() => Complaint, (complaint) => complaint.attachments)
  complaint: Complaint;
}
