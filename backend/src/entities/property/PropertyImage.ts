import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Property } from './Property';

@Entity('property_images')
export class PropertyImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  propertyId: string;

  @Column({ type: 'varchar' })
  imageUrl: string;

  @Column({ type: 'varchar', nullable: true })
  caption: string;

  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @CreateDateColumn()
  uploadedAt: Date;

  // Relation
  @ManyToOne(() => Property, (property) => property.images)
  property: Property;
}
