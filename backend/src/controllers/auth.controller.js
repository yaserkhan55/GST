import { getUserModel } from '../models/User.model.js';
import { AppError } from '../middleware/error.middleware.js';

export const register = async (req, res, next) => {
  try {
    const User = getUserModel();
    const {
      name,
      email,
      password,
      role,
      gstin,
      company
    } = req.body;

    const normalizedName = name?.trim();
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedCompany = company?.trim() || undefined;
    const normalizedGstin = gstin?.trim().toUpperCase() || undefined;

    if (!normalizedName || !normalizedEmail || !password) {
      return next(new AppError('Name, email and password are required', 400));
    }

    if (!process.env.JWT_SECRET) {
      return next(new AppError('JWT configuration is missing on the server', 500));
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return next(new AppError('Email already registered', 400));
    }

    const safeRole = 'client';

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password,
      role: safeRole,
      gstin: normalizedGstin,
      company: normalizedCompany
    });
    const token = user.generateToken();

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        gstin: user.gstin,
        company: user.company
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const User = getUserModel();
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;

    if (!email || !password) {
      return next(new AppError('Email and password are required', 400));
    }

    if (!process.env.JWT_SECRET) {
      return next(new AppError('JWT configuration is missing on the server', 500));
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new AppError('Invalid email or password', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Account is deactivated. Contact administrator.', 403));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid email or password', 401));
    }

    const token = user.generateToken();
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        gstin: user.gstin,
        company: user.company,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const User = getUserModel();
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const User = getUserModel();
    const { name, company, gstin } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, company, gstin },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
