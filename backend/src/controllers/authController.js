const jwt = require('jsonwebtoken');
const { User, StudentProfile, Company } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { getJwtConfig } = require('../config/jwt');
const { AUTH_COOKIE_NAME, getAuthCookieOptions, getClearCookieOptions } = require('../config/cookie');

const generateToken = (user) => {
  const config = getJwtConfig();
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      tokenVersion: user.tokenVersion || 0,
    },
    config.secret,
    {
      algorithm: config.algorithm,
      expiresIn: config.expiresIn,
      issuer: config.issuer,
      audience: config.audience,
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

    if (role !== undefined && typeof role !== 'string') {
      return errorResponse(res, 400, 'Invalid Registration Role', 'Role parameter must be a string');
    }

    const assignedRole = (typeof role === 'string' && role.trim()) ? role.trim().toUpperCase() : 'STUDENT';
    const allowedPublicRoles = ['STUDENT', 'RECRUITER'];

    // Explicit security check: Prevent privilege escalation via public registration
    if (assignedRole === 'UNIVERSITY_ADMIN' || assignedRole === 'ADMIN' || !allowedPublicRoles.includes(assignedRole)) {
      return errorResponse(
        res,
        400,
        'Invalid Registration Role',
        'Direct registration for administrative roles is prohibited. Public registration is restricted to STUDENT and RECRUITER only.'
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

    // Set secure HttpOnly authentication cookie
    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    return successResponse(res, 201, 'User registered successfully', {
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isVerified: newUser.isVerified,
        createdAt: newUser.createdAt,
      },
      token, // Kept in body for test client backward compatibility
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

    // Set secure HttpOnly authentication cookie
    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    return successResponse(res, 200, 'Login successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
      token, // Kept in body for test client backward compatibility
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

const logout = async (req, res, next) => {
  try {
    // Increment user tokenVersion on the server to immediately invalidate all existing JWTs
    if (req.user && req.user.id) {
      await User.findByIdAndUpdate(req.user.id, { $inc: { tokenVersion: 1 } });
    }
    res.clearCookie(AUTH_COOKIE_NAME, getClearCookieOptions());
    return successResponse(res, 200, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};

