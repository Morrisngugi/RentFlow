import { Router, Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { agentService } from '../services/AgentService';
import { authenticate, AuthenticatedRequest, checkUserActive } from '../middleware/auth';
import { CreateAgentProfileRequest } from '../services/AgentService';

const router = Router();

/**
 * GET /api/v1/agents
 * Get all agents
 */
router.get('/', authenticate, checkUserActive, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📝 [GET /agents] Fetching all agents...');
    
    // Check if user has admin or agent role
    if (!req.user) {
      console.warn('⚠️ [GET /agents] Unauthorized: No user in request');
      return res.status(401).json({
        error: {
          status: 401,
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const agents = await agentService.getAllAgents();
    console.log(`✅ [GET /agents] Successfully fetched ${agents.length} agents`);

    return res.status(200).json({
      message: 'Agents retrieved successfully',
      data: agents,
    });
  } catch (error: any) {
    console.error('❌ [GET /agents] Error:', {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      error: {
        status: 500,
        message: error.message,
        code: 'AGENT_FETCH_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    });
  }
});

/**
 * GET /api/v1/agents/:id
 * Get agent by ID
 * Query params: ?detailed=true (includes properties and units count)
 */
router.get('/:id', authenticate, checkUserActive, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          status: 401,
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const { id } = req.params;
    const { detailed } = req.query;

    let agent;
    if (detailed === 'true') {
      agent = await agentService.getAgentDetailedInfo(id);
    } else {
      agent = await agentService.getAgentById(id);
    }

    if (!agent) {
      return res.status(404).json({
        error: {
          status: 404,
          message: 'Agent not found',
          code: 'NOT_FOUND',
        },
      });
    }

    return res.status(200).json({
      message: 'Agent retrieved successfully',
      data: agent,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        status: 500,
        message: error.message,
        code: 'AGENT_FETCH_ERROR',
      },
    });
  }
});

/**
 * POST /api/v1/agents
 * Create or update agent profile
 */
router.post('/', authenticate, checkUserActive, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📝 [POST /agents] Creating/updating agent profile...', { userId: req.body.userId });
    
    if (!req.user) {
      console.warn('⚠️ [POST /agents] Unauthorized: No user in request');
      return res.status(401).json({
        error: {
          status: 401,
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const { userId, officeName, officeLocation, isActive } = req.body;

    // Validate required fields
    if (!userId || !officeName || !officeLocation) {
      console.warn('⚠️ [POST /agents] Validation failed:', { userId, officeName, officeLocation });
      return res.status(400).json({
        error: {
          status: 400,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: ['userId, officeName, and officeLocation are required'],
        },
      });
    }

    const agentData: CreateAgentProfileRequest = {
      userId,
      officeName,
      officeLocation,
      isActive,
    };

    const agent = await agentService.createOrUpdateAgentProfile(agentData);
    console.log(`✅ [POST /agents] Agent profile saved for userId: ${userId}`);

    return res.status(201).json({
      message: 'Agent profile created/updated successfully',
      data: agent,
    });
  } catch (error: any) {
    console.error('❌ [POST /agents] Error:', {
      message: error.message,
      stack: error.stack,
    });
    const statusCode = error.message.includes('not found') ? 404 : 500;
    return res.status(statusCode).json({
      error: {
        status: statusCode,
        message: error.message,
        code: 'AGENT_CREATION_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    });
  }
});

/**
 * PATCH /api/v1/agents/:id/status
 * Update agent status (active/inactive)
 */
router.patch('/:id/status', authenticate, checkUserActive, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          status: 401,
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        error: {
          status: 400,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: ['isActive must be a boolean'],
        },
      });
    }

    const agent = await agentService.updateAgentStatus(id, isActive);

    return res.status(200).json({
      message: 'Agent status updated successfully',
      data: agent,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    return res.status(statusCode).json({
      error: {
        status: statusCode,
        message: error.message,
        code: 'AGENT_UPDATE_ERROR',
      },
    });
  }
});

/**
 * DELETE /api/v1/agents/:id
 * Delete agent profile
 */
router.delete('/:id', authenticate, checkUserActive, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          status: 401,
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const { id } = req.params;
    await agentService.deleteAgentProfile(id);

    return res.status(200).json({
      message: 'Agent profile deleted successfully',
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    return res.status(statusCode).json({
      error: {
        status: statusCode,
        message: error.message,
        code: 'AGENT_DELETE_ERROR',
      },
    });
  }
});

export default router;
