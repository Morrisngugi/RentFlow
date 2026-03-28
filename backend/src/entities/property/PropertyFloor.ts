import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Property } from './Property';
import { PropertyUnit } from './PropertyUnit';

@Entity('property_floors')
export class PropertyFloor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  propertyId!: string;

  @Column({ type: 'int' })
  floorNumber!: number;

  @Column({ type: 'varchar', nullable: true })
  floorName!: string; // e.g., "Ground Floor", "First Floor", "2nd Floor"

  @Column({ type: 'int' })
  unitsPerFloor!: number;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Property, (property) => property.floors, {
    onDelete: 'CASCADE',
  })
  property!: Property;

  @OneToMany(() => PropertyUnit, (unit) => unit.floor, {
    cascade: true,
  })
  units!: PropertyUnit[];
}
