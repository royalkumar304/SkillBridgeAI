const jwt = require('jsonwebtoken');
const { User, StudentProfile, Company } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    process.env.JWT_SECRET || 'super_secret_jwt_key_skillbridge_2026',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Basic input validation
    if (!name || !email || !password) {
      return errorResponse(res, 400, 'Validation Error', 'Name, email, and password are required');
    }

    if (password.length < 6) {
      return errorResponse(res, 400, 'Validation Error', 'Password must be at least 6 characters long');
    }

    const assignedRole = role ? role.toUpperCase() : 'STUDENT';
    const validRoles = ['STUDENT', 'UNIVERSITY_ADMIN', 'RECRUITER'];
    if (!validRoles.includes(assignedRole)) {
      return errorResponse(
        res,
        400,
        'Validation Error',
        `Invalid role: ${role}. Must be one of [${validRoles.join(', ')}]`
      );
    }

    // Check existing email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse(res, 409, 'Conflict Error', 'A user with this email address already exists');
    }

    // Hash password
    const passwordHash = await User.hashPassword(password);

    // Create user
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: assignedRole,
      isVerified: false,
    });

    const token = generateToken(newUser);

    return successResponse(res, 201, 'User registered successfully', {
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isVerified: newUser.isVerified,
        createdAt: newUser.createdAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, 'Validation Error', 'Email and password are required');
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return errorResponse(res, 401, 'Authentication Failed', 'Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Authentication Failed', 'Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      return errorResponse(res, 403, 'Account Suspended', 'Your account is currently suspended or pending verification');
    }

    const token = generateToken(user);

    return successResponse(res, 200, 'Login successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 404, 'Not Found', 'User profile not found');
    }

    return successResponse(res, 200, 'Current profile retrieved', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};

