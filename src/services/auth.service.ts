import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (userId: number, email: string): string => {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

export const verifyToken = (token: string): { userId: number; email: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    return decoded;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
};

export const generateTrackingToken = (email: string, requestId: number): string => {
  return jwt.sign(
    { email, requestId },
    JWT_SECRET,
    { expiresIn: '90d' }
  );
};

export const verifyTrackingToken = (token: string): { email: string; requestId: number } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string; requestId: number };
    return decoded;
  } catch (error) {
    console.error('Error verifying tracking token:', error);
    return null;
  }
};
