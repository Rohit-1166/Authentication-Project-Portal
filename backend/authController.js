const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, RefreshToken } = require('./models');

// Helper to generate access token
const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user._id, username: user.username, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
};

// Helper to generate refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id, 
      jti: Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
};

// Register a new user
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate inputs
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check for existing user
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or Email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { email: usernameOrEmail.toLowerCase() },
        { username: usernameOrEmail }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshTokenValue = generateRefreshToken(user);

    // Save refresh token in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days matching JWT_REFRESH_EXPIRY

    const refreshTokenDoc = new RefreshToken({
      token: refreshTokenValue,
      userId: user._id,
      expiresAt
    });
    await refreshTokenDoc.save();

    // Set Refresh Token as HTTP-Only Cookie
    res.cookie('refreshToken', refreshTokenValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      message: 'Login successful',
      accessToken,
      refreshToken: refreshTokenValue, // Return in body too for sandbox/playground testing
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Refresh token rotation (OAuth 2.0 Best Practice)
const refresh = async (req, res) => {
  try {
    // Check both cookie and body
    const token = req.body.refreshToken || req.cookies?.refreshToken;

    if (!token) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Find token in DB
    const refreshTokenDoc = await RefreshToken.findOne({ token });

    if (!refreshTokenDoc) {
      // Security Case: If the refresh token was used, but it's not in our database, it could have been deleted
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // If token is revoked, check if someone is attempting a replay attack
    if (refreshTokenDoc.isRevoked) {
      // Replay attack detection: Revoke all tokens issued from this family/user to be safe
      await RefreshToken.updateMany({ userId: refreshTokenDoc.userId }, { isRevoked: true });
      return res.status(401).json({ message: 'Compromised refresh token. All sessions revoked.' });
    }

    if (refreshTokenDoc.isExpired) {
      return res.status(401).json({ message: 'Expired refresh token. Please login again.' });
    }

    // Verify token validity with jwt
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid refresh token signature' });
    }

    // Fetch user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Generate NEW access token and NEW refresh token (Token Rotation!)
    const newAccessToken = generateAccessToken(user);
    const newRefreshTokenValue = generateRefreshToken(user);

    // Revoke current token and link to new one
    refreshTokenDoc.isRevoked = true;
    refreshTokenDoc.replacedByToken = newRefreshTokenValue;
    await refreshTokenDoc.save();

    // Create new refresh token doc
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const newRefreshTokenDoc = new RefreshToken({
      token: newRefreshTokenValue,
      userId: user._id,
      expiresAt
    });
    await newRefreshTokenDoc.save();

    // Update Cookie
    res.cookie('refreshToken', newRefreshTokenValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
      refreshToken: newRefreshTokenValue
    });
  } catch (error) {
    console.error('Refresh Error:', error);
    res.status(500).json({ message: 'Server error during token refresh' });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;

    if (token) {
      // Revoke token in DB
      await RefreshToken.findOneAndUpdate({ token }, { isRevoked: true });
    }

    // Clear Cookie
    res.clearCookie('refreshToken');

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
};

// Get current user profile
const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  me
};
