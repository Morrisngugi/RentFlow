import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../User';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', nullable: true })
  notificationType: string;

  @Column({ type: 'varchar', nullable: true })
  relatedEntityType: string;

  @Column({ type: 'uuid', nullable: true })
  relatedEntityId: string;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ type: 'boolean', default: false })
  smsSent: boolean;

  @Column({ type: 'boolean', default: false })
  emailSent: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // Relation
  @ManyToOne(() => User, (user) => user.notifications)
  user: User;
}
