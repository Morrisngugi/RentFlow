import { AgentTransaction } from '../entities/AgentTransaction';
import { AppDataSource } from '../config/database';
import { DeepPartial } from 'typeorm';

export interface LogTransactionParams {
  agentId: string;
  actionType: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  description?: string;
  metadata?: any;
}

export interface AgentTransactionResponse {
  id: string;
  agentId: string;
  actionType: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  description?: string;
  metadata?: any;
  createdAt: Date;
}

export interface AgentActivityStats {
  totalTransactions: number;
  transactionsByType: Record<string, number>;
  recentActivity: AgentTransactionResponse[];
  lastActivityDate?: Date;
}

export class AgentTransactionService {
  private repository = AppDataSource.getRepository(AgentTransaction);

  /**
   * Log an agent transaction
   */
  async logTransaction(params: LogTransactionParams): Promise<AgentTransactionResponse> {
    const transactionData: DeepPartial<AgentTransaction> = {
      agentId: params.agentId,
      actionType: params.actionType,
      relatedEntityId: params.relatedEntityId,
      relatedEntityType: params.relatedEntityType,
      description: params.description,
      metadata: params.metadata,
    };

    const transaction = this.repository.create(transactionData);

    const savedTransactionResult = await this.repository.save(transaction);
    const savedTransaction = Array.isArray(savedTransactionResult) ? savedTransactionResult[0] : savedTransactionResult;

    return this.toResponse(savedTransaction);
  }

  /**
   * Get all transactions for an agent
   */
  async getAgentTransactions(
    agentId: string,
    filters?: {
      actionType?: string;
      relatedEntityType?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<AgentTransactionResponse[]> {
    const query = this.repository
      .createQueryBuilder('transaction')
      .where('transaction.agentId = :agentId', { agentId });

    if (filters?.actionType) {
      query.andWhere('transaction.actionType = :actionType', { actionType: filters.actionType });
    }

    if (filters?.relatedEntityType) {
      query.andWhere('transaction.relatedEntityType = :relatedEntityType', {
        relatedEntityType: filters.relatedEntityType,
      });
    }

    if (filters?.startDate) {
      query.andWhere('transaction.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('transaction.createdAt <= :endDate', { endDate: filters.endDate });
    }

    query.orderBy('transaction.createdAt', 'DESC');

    if (filters?.limit) {
      query.limit(filters.limit);
    }

    if (filters?.offset) {
      query.offset(filters.offset);
    }

    const transactions = await query.getMany();
    return transactions.map(t => this.toResponse(t));
  }

  /**
   * Get activity statistics for an agent
   */
  async getActivityStats(agentId: string, days: number = 30): Promise<AgentActivityStats> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactions = await this.repository
      .createQueryBuilder('transaction')
      .where('transaction.agentId = :agentId', { agentId })
      .andWhere('transaction.createdAt >= :startDate', { startDate })
      .orderBy('transaction.createdAt', 'DESC')
      .getMany();

    const totalTransactions = await this.repository.countBy({ agentId });

    // Count by action type
    const transactionsByType: Record<string, number> = {};
    transactions.forEach(t => {
      transactionsByType[t.actionType] = (transactionsByType[t.actionType] || 0) + 1;
    });

    return {
      totalTransactions,
      transactionsByType,
      recentActivity: transactions.slice(0, 10).map(t => this.toResponse(t)),
      lastActivityDate: transactions.length > 0 ? transactions[0].createdAt : undefined,
    };
  }

  /**
   * Get transactions by entity
   */
  async getTransactionsByEntity(
    agentId: string,
    entityType: string,
    entityId: string
  ): Promise<AgentTransactionResponse[]> {
    const transactions = await this.repository.find({
      where: {
        agentId,
        relatedEntityType: entityType,
        relatedEntityId: entityId,
      },
      order: { createdAt: 'DESC' },
    });

    return transactions.map(t => this.toResponse(t));
  }

  /**
   * Get all agents' transactions with pagination
   */
  async getAllTransactions(
    filters?: {
      agentId?: string;
      actionType?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ data: AgentTransactionResponse[]; total: number }> {
    let query = this.repository.createQueryBuilder('transaction');

    if (filters?.agentId) {
      query = query.where('transaction.agentId = :agentId', { agentId: filters.agentId });
    }

    if (filters?.actionType) {
      query = query.andWhere('transaction.actionType = :actionType', { actionType: filters.actionType });
    }

    if (filters?.startDate) {
      query = query.andWhere('transaction.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query = query.andWhere('transaction.createdAt <= :endDate', { endDate: filters.endDate });
    }

    const total = await query.getCount();

    query = query.orderBy('transaction.createdAt', 'DESC');

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    const data = await query.getMany();

    return {
      data: data.map(t => this.toResponse(t)),
      total,
    };
  }

  /**
   * Convert entity to response object
   */
  private toResponse(transaction: AgentTransaction): AgentTransactionResponse {
    return {
      id: transaction.id,
      agentId: transaction.agentId,
      actionType: transaction.actionType,
      relatedEntityId: transaction.relatedEntityId,
      relatedEntityType: transaction.relatedEntityType,
      description: transaction.description,
      metadata: transaction.metadata,
      createdAt: transaction.createdAt,
    };
  }
}

// Export singleton instance
export const agentTransactionService = new AgentTransactionService();
