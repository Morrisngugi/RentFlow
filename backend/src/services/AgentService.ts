import { User } from '../entities/User';
import { AgentProfile } from '../entities/profile/AgentProfile';
import { Property } from '../entities/property/Property';
import { PropertyFloor } from '../entities/property/PropertyFloor';
import { PropertyUnit } from '../entities/property/PropertyUnit';
import { AppDataSource } from '../config/database';

export interface AgentListResponse {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  officeName: string;
  officeLocation: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyWithUnitsCount {
  id: string;
  name: string;
  address: string;
  city: string;
  propertyType: string;
  unitsCount: number;
}

export interface AgentDetailedResponse extends AgentListResponse {
  propertiesManaged: number;
  propertyDetails: PropertyWithUnitsCount[];
}

export interface CreateAgentProfileRequest {
  userId: string;
  officeName: string;
  officeLocation: string;
  isActive?: boolean;
}

export class AgentService {
  private userRepository = AppDataSource.getRepository(User);
  private agentProfileRepository = AppDataSource.getRepository(AgentProfile);
  private propertyRepository = AppDataSource.getRepository(Property);
  private propertyFloorRepository = AppDataSource.getRepository(PropertyFloor);
  private propertyUnitRepository = AppDataSource.getRepository(PropertyUnit);

  /**
   * Get all agents (users with role = 'agent')
   */
  async getAllAgents(): Promise<AgentListResponse[]> {
    const agentProfiles = await this.agentProfileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('user.role = :role', { role: 'agent' })
      .orderBy('profile.createdAt', 'DESC')
      .getMany();

    return agentProfiles.map(profile => ({
      id: profile.id,
      userId: profile.user.id,
      firstName: profile.user.firstName,
      lastName: profile.user.lastName,
      email: profile.user.email,
      phoneNumber: profile.user.phoneNumber,
      officeName: profile.officeName,
      officeLocation: profile.officeLocation,
      isActive: profile.isActive,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    }));
  }

  /**
   * Get agent by ID
   */
  async getAgentById(agentId: string): Promise<AgentListResponse | null> {
    const agentProfile = await this.agentProfileRepository.findOne({
      where: { id: agentId },
      relations: ['user'],
    });

    if (!agentProfile) {
      return null;
    }

    const user = agentProfile.user;
    return {
      id: agentProfile.id,
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      officeName: agentProfile.officeName,
      officeLocation: agentProfile.officeLocation,
      isActive: agentProfile.isActive,
      createdAt: agentProfile.createdAt,
      updatedAt: agentProfile.updatedAt,
    };
  }

  /**
   * Get agent details with properties and units count
   */
  async getAgentDetailedInfo(agentId: string): Promise<AgentDetailedResponse | null> {
    const agentProfile = await this.agentProfileRepository.findOne({
      where: { id: agentId },
      relations: ['user'],
    });

    if (!agentProfile) {
      return null;
    }

    // Get all properties managed by this agent
    const properties = await this.propertyRepository.find({
      where: { agentId: agentProfile.userId },
      relations: ['floors', 'floors.units'],
    });

    // Calculate units count per property
    const propertyDetails: PropertyWithUnitsCount[] = properties.map(property => {
      const unitsCount = (property.floors || []).reduce((total, floor) => {
        return total + (floor.units?.length || 0);
      }, 0);

      return {
        id: property.id,
        name: property.name,
        address: property.address,
        city: property.city,
        propertyType: property.propertyType || 'N/A',
        unitsCount,
      };
    });

    const user = agentProfile.user;
    return {
      id: agentProfile.id,
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      officeName: agentProfile.officeName,
      officeLocation: agentProfile.officeLocation,
      isActive: agentProfile.isActive,
      propertiesManaged: properties.length,
      propertyDetails,
      createdAt: agentProfile.createdAt,
      updatedAt: agentProfile.updatedAt,
    };
  }

  /**
   * Create or update agent profile
   */
  async createOrUpdateAgentProfile(data: CreateAgentProfileRequest): Promise<AgentListResponse> {
    // Check if user exists and has agent role
    const user = await this.userRepository.findOne({
      where: { id: data.userId, role: 'agent' },
    });

    if (!user) {
      throw new Error('User not found or is not an agent');
    }

    // Check if profile already exists
    let agentProfile = await this.agentProfileRepository.findOne({
      where: { userId: data.userId },
    });

    if (agentProfile) {
      // Update existing profile
      agentProfile.officeName = data.officeName;
      agentProfile.officeLocation = data.officeLocation;
      if (data.isActive !== undefined) {
        agentProfile.isActive = data.isActive;
      }
      agentProfile.updatedAt = new Date();
    } else {
      // Create new profile
      agentProfile = this.agentProfileRepository.create({
        userId: data.userId,
        officeName: data.officeName,
        officeLocation: data.officeLocation,
        isActive: data.isActive ?? true,
      });
    }

    await this.agentProfileRepository.save(agentProfile);

    return {
      id: agentProfile.id,
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      officeName: agentProfile.officeName,
      officeLocation: agentProfile.officeLocation,
      isActive: agentProfile.isActive,
      createdAt: agentProfile.createdAt,
      updatedAt: agentProfile.updatedAt,
    };
  }

  /**
   * Update agent status
   */
  async updateAgentStatus(agentId: string, isActive: boolean): Promise<AgentListResponse> {
    const agentProfile = await this.agentProfileRepository.findOne({
      where: { id: agentId },
      relations: ['user'],
    });

    if (!agentProfile) {
      throw new Error('Agent profile not found');
    }

    agentProfile.isActive = isActive;
    agentProfile.updatedAt = new Date();
    await this.agentProfileRepository.save(agentProfile);

    const user = agentProfile.user;
    return {
      id: agentProfile.id,
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      officeName: agentProfile.officeName,
      officeLocation: agentProfile.officeLocation,
      isActive: agentProfile.isActive,
      createdAt: agentProfile.createdAt,
      updatedAt: agentProfile.updatedAt,
    };
  }

  /**
   * Delete agent profile
   */
  async deleteAgentProfile(agentId: string): Promise<void> {
    const agentProfile = await this.agentProfileRepository.findOne({
      where: { id: agentId },
    });

    if (!agentProfile) {
      throw new Error('Agent profile not found');
    }

    await this.agentProfileRepository.remove(agentProfile);
  }
}

// Export singleton instance
export const agentService = new AgentService();
