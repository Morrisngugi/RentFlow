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

@Entity('property_floors')
export class PropertyFloor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  propertyId!: string;

  @Column({ type: 'int' })
  floorNumber!: number;

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

  @OneToMany('PropertyUnit', (unit: any) => unit.floor, {
    cascade: true,
  })
  units!: any[];
}
