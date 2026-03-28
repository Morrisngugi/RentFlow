import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { User } from '../entities/User';
import { AppDataSource } from '../config/database';
import { env } from '../config/env';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  token: string;
  expiresIn: string;
}

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  /**
   * Hash a plain text password
   */
  async hashPassword(plainPassword: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plainPassword, salt);
  }

  /**
   * Compare plain password with hash
   */
  async validatePassword(plainPassword: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
  }

  /**
   * Generate JWT token
   */
  generateToken(userId: string, email: string, role: string): string {
    const payload = { userId, email, role };
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRY,
      algorithm: 'HS256',
    } as any) as string;
  }

  /**
   * Verify and decode JWT token
   */
  verifyToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      }
      throw new Error('Invalid token');
    }
  }

  /**
   * Register a new user
   */
  async register(userData: {
    email: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    idNumber: string;
    password: string;
    role?: string;
  }): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await this.hashPassword(userData.password);

    // Create new user
    const userRole = (userData.role || 'tenant') as 'admin' | 'agent' | 'landlord' | 'tenant';
    const user = this.userRepository.create({
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      firstName: userData.firstName,
      lastName: userData.lastName,
      idNumber: userData.idNumber,
      passwordHash,
      role: userRole,
      isActive: true,
    });

    await this.userRepository.save(user);

    // Generate token
    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token,
      expiresIn: env.JWT_EXPIRY,
    };
  }

  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    // Find user with password hash
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'firstName', 'lastName', 'passwordHash', 'isActive', 'role'],
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is inactive');
    }

    // Validate password
    const isPasswordValid = await this.validatePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token,
      expiresIn: env.JWT_EXPIRY,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: Partial<{
      firstName: string;
      lastName: string;
      phoneNumber: string;
      profilePictureUrl: string;
    }>
  ): Promise<User> {
    await this.userRepository.update({ id: userId }, updates);
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Change password
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'passwordHash'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Validate old password
    const isValid = await this.validatePassword(oldPassword, user.passwordHash);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword);
    await this.userRepository.update({ id: userId }, { passwordHash });
  }
}

export const authService = new AuthService();
