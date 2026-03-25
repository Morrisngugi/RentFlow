import { IsString, IsEmail, IsOptional, IsNumber, IsDate, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTenantDTO {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsString()
  @IsNotEmpty()
  idNumber!: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @IsString()
  @IsNotEmpty()
  nationality!: string;

  @IsString()
  @IsOptional()
  maritalStatus?: string;

  @IsNumber()
  @IsOptional()
  numberOfChildren?: number;

  @IsString()
  @IsOptional()
  occupation?: string;

  @IsString()
  @IsOptional()
  postalAddress?: string;

  @IsString()
  @IsOptional()
  nextOfKinName?: string;

  @IsString()
  @IsOptional()
  nextOfKinPhone?: string;

  @IsString()
  @IsOptional()
  nextOfKinRelationship?: string;

  // Lease Details
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  monthlyRent!: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  securityFee?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  garbageAmount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  waterUnitCost?: number;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  dateJoined!: Date;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  leaseTermMonths!: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  rentDueDate?: Date;

  @IsString()
  @IsOptional()
  notes?: string;

  // Deposit Breakdown
  @IsNumber()
  @IsOptional()
  @Min(0)
  rentDeposit?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  waterDeposit?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  electricityDeposit?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  otherDeposit?: number;

  @IsString()
  @IsOptional()
  otherDepositDescription?: string;
}
