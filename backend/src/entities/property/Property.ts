import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../User';
import { PropertyImage } from './PropertyImage';
import { PropertyFloor } from './PropertyFloor';
import { PropertyRoomTypePricing } from './PropertyRoomTypePricing';
import { Lease } from '../lease/Lease';

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid' })
  agentId!: string; // Agent who created/manages this property

  @Column({ type: 'uuid' })
  landlordId!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'text' })
  address!: string;

  @Column({ type: 'varchar' })
  city!: string;

  @Column({ type: 'varchar', nullable: true })
  postalCode!: string;

  @Column({ type: 'varchar', default: 'Kenya' })
  country!: string;

  @Column({ type: 'int', nullable: true })
  bedrooms!: number;

  @Column({ type: 'int', nullable: true })
  bathrooms!: number;

  @Column({ type: 'int', nullable: true })
  sqft!: number;

  @Column({
    type: 'enum',
    enum: ['apartment', 'house', 'commercial'],
    nullable: true,
  })
  propertyType!: string;

  @Column({
    type: 'enum',
    enum: ['rental', 'airbnb'],
    default: 'rental',
  })
  propertyModel!: string; // rental = traditional monthly, airbnb = daily/weekly booking

  @Column({ type: 'numeric', nullable: true, default: null })
  securityFee!: number; // Optional monthly fee for security personnel (watchmen/guards). Only for rental properties.

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'numeric', nullable: true })
  monthlyRent!: number | null;

  @Column({ type: 'numeric', nullable: true })
  depositAmount!: number | null;

  @Column({ type: 'simple-array', nullable: true })
  utilitiesIncluded!: string[];

  @Column({ type: 'simple-array', nullable: true })
  imageUrls!: string[];

  @Column({ type: 'boolean', default: true })
  isAvailable!: boolean;

  @CreateDateColumn() createdAt!: Date;

  @UpdateDateColumn() updatedAt!: Date;

  // Relations
  @ManyToOne(() => User)
  agent!: User;

  @ManyToOne(() => User)
  landlord!: User;

  @OneToMany(() => PropertyImage, (image) => image.property, {
    cascade: true,
  })
  images!: PropertyImage[];

  @OneToMany(() => PropertyFloor, (floor) => floor.property, {
    cascade: true,
  })
  floors!: PropertyFloor[];

  @OneToMany(() => PropertyRoomTypePricing, (pricing) => pricing.property, {
    cascade: true,
  })
  roomTypePricing!: PropertyRoomTypePricing[];

  @OneToMany(() => Lease, (lease) => lease.property)
  leases!: Lease[];
}

