import {
  createUser,
  resolveUserByEmail,
  getUserById,
  updateUser,
} from "../services/dataService.js";
import { signAccessToken, verifyPassword } from "../services/tokenService.js";
import { sampleUser } from "../data/sample.js";
import { env } from "../config/env.js";
import {
  findValidRefreshSession,
  issueRefreshToken,
  revokeRefreshToken,
} from "../services/sessionService.js";
import { 
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangeEmail 
} from "../services/emailService.js";
import {
  createPasswordResetToken,
  consumePasswordResetToken,
  updateUserPassword,
} from "../services/passwordResetService.js";
import { createNotification } from "../services/notificationService.js";
import { UserModel } from "../models/User.js";

function serializeUser(userDoc) {
  if (!userDoc) return null;
  const {
    password: UNUSED_PASSWORD,
    passwordHash: UNUSED_PASSWORD_HASH,
    _id,
    id,
    __v,
    ...rest
  } = userDoc;
  return {
    id: (id ?? _id ?? sampleUser.id).toString(),
    role: userDoc.role ?? rest.role ?? "user",
    ...rest,
  };
}

function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const errors = [];
  if (password.length < minLength) errors.push(`Password must be at least ${minLength} characters long`);
  if (!hasUpperCase) errors.push('Password must contain at least one uppercase letter');
  if (!hasLowerCase) errors.push('Password must contain at least one lowercase letter');
  if (!hasNumbers) errors.push('Password must contain at least one number');
  if (!hasSpecialChar) errors.push('Password must contain at least one special character');
  
  return errors;
}

export async function signup(req, res) {
  const { firstName, lastName, email, password, country, phone, timezone } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: "Missing required fields. firstName, lastName, email and password are required." });
  }

  // Validate password strength
  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0) {
    return res.status(400).json({ 
      error: "Password does not meet requirements",
      details: passwordErrors
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Validate phone number presence
  if (!phone || !phone.trim()) {
    return res.status(400).json({ 
      error: "Phone number is required. Please provide a valid phone number." 
    });
  }

  // Validate country presence
  if (!country || !country.trim()) {
    return res.status(400).json({ 
      error: "Country is required. Please select your country of residence." 
    });
  }

  try {
    const existing = await resolveUserByEmail(email);
    if (existing && !env.useSampleData) {
      return res.status(409).json({ error: "Email already in use." });
    }

    const user = await createUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password,
      country: country?.trim?.() ?? "",
      phone: phone?.trim?.() ?? "",
      timezone: timezone ?? "UTC",
      settings: {
        priceAlerts: true,
        portfolioSummaries: true,
        twoFactorEnabled: false,
      },
      lastPasswordChange: new Date(),
    });

    const safeUser = serializeUser(user);
    const token = signAccessToken({ sub: safeUser.id });
    const refresh = await issueRefreshToken({
      userId: safeUser.id,
      ipAddress: req.ip,
      userAgent: req.get("user-agent") ?? "unknown",
    });

    // Fire and forget welcome email so signup response is not delayed
    void sendWelcomeEmail({
      to: safeUser.email,
      firstName,
      lastName,
    });

    return res.status(201).json({
      user: safeUser,
      token,
      refreshToken: refresh.refreshToken,
      refreshExpiresAt: refresh.expiresAt,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: "Unable to create account." });
  }
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required." });
  }

  try {
    const user = await resolveUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Check account lockout
    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS && user.lockoutUntil > new Date()) {
      const remainingTime = Math.ceil((user.lockoutUntil - new Date()) / 60000);
      return res.status(423).json({ 
        error: "Account temporarily locked",
        remainingMinutes: remainingTime
      });
    }

    const validPassword = await verifyPassword(password, user);
    if (!validPassword) {
      // Increment login attempts
      const loginAttempts = (user.loginAttempts || 0) + 1;
      const userIdForUpdate = user.id ?? (user._id?.toString?.() ?? user._id);
      const updates = { 
        loginAttempts,
        lastLoginAttempt: new Date()
      };
      
      if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        updates.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION);
      }
      
  await updateUser(userIdForUpdate, updates);
      
      return res.status(401).json({ 
        error: "Invalid email or password.",
        attemptsRemaining: Math.max(0, MAX_LOGIN_ATTEMPTS - loginAttempts)
      });
    }

    // Reset login attempts on successful login
    const userIdForUpdate = user.id ?? (user._id?.toString?.() ?? user._id);
    await updateUser(userIdForUpdate, {
      loginAttempts: 0,
      lockoutUntil: null,
      lastLogin: new Date()
    });

    const safeUser = serializeUser(user);
    const token = signAccessToken({ sub: safeUser.id });
    const refresh = await issueRefreshToken({
      userId: safeUser.id,
      ipAddress: req.ip,
      userAgent: req.get("user-agent") ?? "unknown",
    });

    return res.json({
      user: safeUser,
      token,
      refreshToken: refresh.refreshToken,
      refreshExpiresAt: refresh.expiresAt,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Login failed." });
  }
}

export async function profile(req, res) {
  try {
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    return res.json({ user: serializeUser(user) });
  } catch (error) {
    console.error("Profile error:", error);
    return res.status(500).json({ error: "Unable to load profile." });
  }
}

export async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const updates = req.body;
    
    // Prevent updating sensitive fields
    delete updates.password;
    delete updates.passwordHash;
    delete updates.role;
    delete updates._id;
    delete updates.id;
    
    const { UserModel } = await import("../models/User.js");
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-passwordHash");
    
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }
    
    return res.json({ 
      user: serializeUser(updatedUser),
      message: "Profile updated successfully."
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ error: "Unable to update profile." });
  }
}

export async function refreshSession(req, res) {
  try {
    const { refreshToken } = req.body ?? {};
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required." });
    }
    const session = await findValidRefreshSession(refreshToken);
    if (!session) {
      return res.status(401).json({ error: "Invalid refresh token." });
    }

    const token = signAccessToken({ sub: session.userId.toString() });
    return res.json({ token });
  } catch (error) {
    console.error("refreshSession error:", error);
    return res.status(500).json({ error: "Unable to refresh session." });
  }
}

export async function logout(req, res) {
  try {
    const { refreshToken } = req.body ?? {};
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    return res.status(204).end();
  } catch (error) {
    console.error("logout error:", error);
    return res.status(500).json({ error: "Unable to logout." });
  }
}

export async function requestPasswordReset(req, res) {
  const rawEmail = req.body?.email;
  if (!rawEmail || typeof rawEmail !== "string") {
    return res.status(400).json({ error: "Email is required." });
  }

  const normalizedEmail = rawEmail.trim().toLowerCase();
  if (!normalizedEmail) {
    return res.status(400).json({ error: "Email is required." });
  }

  try {
    const user = await resolveUserByEmail(normalizedEmail);
    // Always return generic success to avoid account enumeration
    if (!user) {
      return res.json({ message: "If the account exists, password reset instructions have been sent." });
    }

    const { token } = await createPasswordResetToken(user);
    
    // Send password reset email (send even in sample mode where transport might be no-op)
    const clientBaseUrl =
      env.clientUrl ??
      env.consoleBaseUrl?.replace(/\/+dashboard$/, "") ??
      env.allowedOrigins?.[0] ??
      "https://app.invisphere.com";
    const safeBaseUrl = clientBaseUrl?.replace(/\/+$/, "") || "https://app.invisphere.com";
    const resetUrl = `${safeBaseUrl}/reset-password?token=${token}`;

    await sendPasswordResetEmail({
      to: user.email,
      firstName: user.firstName,
      resetUrl,
    });

    // Notify all admins with the reset token for manual assistance
    if (!env.useSampleData) {
      const adminUsers = await UserModel.find({
        role: { $in: ["admin", "superadmin"] },
        isActive: { $ne: false },
      })
        .select("_id email role firstName lastName")
        .lean()
        .exec();

      await Promise.all(
        adminUsers.map((admin) =>
          createNotification({
            userId: admin._id,
            type: "password_reset_request",
            title: "Password Reset Request",
            body: `User ${user.firstName} ${user.lastName} (${user.email}) requested a password reset. Token: ${token}`,
            metadata: {
              requestedBy: user._id?.toString() || user.id,
              requestedEmail: user.email,
              resetToken: token,
              resetUrl,
              requestedAt: new Date().toISOString(),
            },
          }),
        ),
      );

      // Emit a real-time notification to the shared admin channel so operators don't need to refresh
      const io = req.io ?? req.app?.get?.("io") ?? global.io;
      if (io) {
        io.to("admin-room").emit("admin_notification", {
          type: "password_reset_request",
          title: "Password Reset Request",
          body: `${user.firstName} ${user.lastName} (${user.email}) is waiting for a password reset.`,
          metadata: {
            requestedEmail: user.email,
          },
          createdAt: new Date().toISOString(),
        });
      }
    }

    return res.json({ message: "If the account exists, password reset instructions have been sent." });
  } catch (error) {
    console.error("Password reset request error:", error);
    return res.status(500).json({ error: "Unable to process password reset request." });
  }
}

export async function resetPassword(req, res) {
  const { token, password } = req.body ?? {};
  if (!token || !password) {
    return res.status(400).json({ error: "Token and password are required." });
  }

  // Validate password strength
  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0) {
    return res.status(400).json({ error: "Password does not meet requirements", details: passwordErrors });
  }

  try {
    const entry = await consumePasswordResetToken(token);
    if (!entry) return res.status(400).json({ error: "Invalid or expired reset token." });

    // Update the user's password using the passwordResetService helper
    await updateUserPassword(entry.userId, password);

    // Fetch user for email personalization (best-effort)
    const user = await getUserById(entry.userId);
    await sendPasswordChangeEmail({ to: user?.email ?? "", firstName: user?.firstName ?? "" });

    return res.json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Password reset error:", error);
    return res.status(500).json({ error: "Unable to reset password." });
  }
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current password and new password are required." });
  }

  // Validate new password strength
  const passwordErrors = validatePassword(newPassword);
  if (passwordErrors.length > 0) {
    return res.status(400).json({ 
      error: "Password does not meet requirements", 
      details: passwordErrors 
    });
  }

  try {
    // Get user from authenticated request
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Verify current password
    const validPassword = await verifyPassword(currentPassword, user);
    if (!validPassword) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    // Update the user's password using the passwordResetService helper
    await updateUserPassword(user.id ?? user._id, newPassword);

    // Send password change notification email
    await sendPasswordChangeEmail({ 
      to: user.email, 
      firstName: user.firstName 
    });

    return res.json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ error: "Unable to change password." });
  }
}
