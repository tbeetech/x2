import { verifyToken } from '../services/tokenService.js';
import { UserModel } from '../models/User.js';
import rateLimit from 'express-rate-limit';

export const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later' },
  validate: false,
});

export const isAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = verifyToken(token);
    const user = await UserModel.findById(decoded.sub);
    
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is inactive' });
    }
    
    req.admin = user;
    next();
  } catch (error) {
    // Log token errors at info level (not errors) since they're expected
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      console.log(`Admin auth: ${error.message} (expired at ${error.expiredAt || 'N/A'})`);
    } else {
      console.error('Admin authentication error:', error);
    }
    res.status(401).json({ error: 'Invalid token' });
  }
};
