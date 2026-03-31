import { AppDataSource } from '../config/database';
import { Complaint } from '../entities/complaint/Complaint';
import { User } from '../entities/User';
import { Lease } from '../entities/lease/Lease';
import { ValidationError, NotFoundError, AuthorizationError, DatabaseError } from '../errors/AppError';
import { DeepPartial } from 'typeorm';

class ComplaintServiceImpl {
  private complaintRepository = AppDataSource.getRepository(Complaint);
  private leaseRepository = AppDataSource.getRepository(Lease);
  private userRepository = AppDataSource.getRepository(User);

  /**
   * Create a new complaint
   */
  async createComplaint(params: {
    leaseId: string;
    tenantId: string;
    title: string;
    description: string;
    complaintType: 'maintenance' | 'billing' | 'safety' | 'noise' | 'other';
    attachmentUrls?: string[];
  }) {
    try {
      console.log('📝 Creating complaint for lease:', params.leaseId);

      // Verify lease exists
      const lease = await this.leaseRepository.findOne({
        where: { id: params.leaseId },
      });

      if (!lease) {
        throw new NotFoundError('Lease', { leaseId: params.leaseId });
      }

      // Verify tenant exists and matches
      const tenant = await this.userRepository.findOne({
        where: { id: params.tenantId },
      });

      if (!tenant) {
        throw new NotFoundError('Tenant', { tenantId: params.tenantId });
      }

      if (lease.tenantId !== params.tenantId) {
        throw new AuthorizationError('Tenant does not belong to this lease');
      }

      const complaint = this.complaintRepository.create({
        leaseId: params.leaseId,
        tenantId: params.tenantId,
        landlordId: lease.landlordId,
        title: params.title,
        description: params.description,
        complaintType: params.complaintType,
        attachmentUrls: params.attachmentUrls || [],
        status: 'open',
      } as DeepPartial<Complaint>);

      const savedComplaintResult = await this.complaintRepository.save(complaint);
      const savedComplaint = Array.isArray(savedComplaintResult)
        ? savedComplaintResult[0]
        : savedComplaintResult;

      console.log('✅ Complaint created:', savedComplaint.id);
      return savedComplaint;
    } catch (error: any) {
      console.error('❌ Error creating complaint:', error.message);
      throw error;
    }
  }

  /**
   * Get complaints for a tenant
   */
  async getTenantComplaints(tenantId: string) {
    try {
      console.log('📋 Fetching complaints for tenant:', tenantId);

      const complaints = await this.complaintRepository.find({
        where: { tenantId },
        order: { createdAt: 'DESC' },
        relations: ['lease', 'tenant', 'landlord'],
      });

      return complaints;
    } catch (error: any) {
      console.error('❌ Error fetching tenant complaints:', error.message);
      throw error;
    }
  }

  /**
   * Get complaints for a landlord/agent
   */
  async getLandlordComplaints(landlordId: string) {
    try {
      console.log('📋 Fetching complaints for landlord:', landlordId);

      const complaints = await this.complaintRepository.find({
        where: { landlordId },
        order: { createdAt: 'DESC' },
        relations: ['lease', 'lease.property', 'tenant', 'landlord'],
      });

      return complaints;
    } catch (error: any) {
      console.error('❌ Error fetching landlord complaints:', error.message);
      throw error;
    }
  }

  /**
   * Get a single complaint
   */
  async getComplaintById(complaintId: string) {
    try {
      console.log('📋 Fetching complaint:', complaintId);

      const complaint = await this.complaintRepository.findOne({
        where: { id: complaintId },
        relations: ['lease', 'lease.property', 'tenant', 'landlord', 'attachments'],
      });

      if (!complaint) {
        throw new NotFoundError('Complaint', { complaintId });
      }

      return complaint;
    } catch (error: any) {
      console.error('❌ Error fetching complaint:', error.message);
      throw error;
    }
  }

  /**
   * Update complaint status
   */
  async updateComplaintStatus(complaintId: string, status: 'open' | 'in_progress' | 'resolved' | 'closed') {
    try {
      console.log('📝 Updating complaint status:', { complaintId, status });

      const complaint = await this.getComplaintById(complaintId);

      const updateData: any = {
        status,
      };

      if (status === 'resolved') {
        updateData.resolvedAt = new Date();
      }

      await this.complaintRepository.update({ id: complaintId }, updateData);

      const updated = await this.getComplaintById(complaintId);
      console.log('✅ Complaint status updated');
      return updated;
    } catch (error: any) {
      console.error('❌ Error updating complaint:', error.message);
      throw error;
    }
  }

  /**
   * Get complaints count by type
   */
  async getComplaintStats(landlordId?: string) {
    try {
      const where = landlordId ? { landlordId } : {};

      const total = await this.complaintRepository.count({ where: { ...where } });
      const open = await this.complaintRepository.count({
        where: { ...where, status: 'open' },
      });
      const inProgress = await this.complaintRepository.count({
        where: { ...where, status: 'in_progress' },
      });
      const resolved = await this.complaintRepository.count({
        where: { ...where, status: 'resolved' },
      });

      return { total, open, inProgress, resolved };
    } catch (error: any) {
      console.error('❌ Error fetching complaint stats:', error.message);
      throw error;
    }
  }
}

export const complaintService = new ComplaintServiceImpl();
