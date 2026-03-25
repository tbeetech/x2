import nodemailer from "nodemailer";
import crypto from "node:crypto";
import logger from "../lib/logger.js";
import { env } from "../config/env.js";

let cachedTransport = null;

function createTransport() {
  if (!env.smtpHost || !env.smtpPort || !env.smtpFrom) {
    logger.warn("Email transport not configured; welcome emails will be skipped.");
    return null;
  }

  if (cachedTransport) {
    return cachedTransport;
  }

  cachedTransport = nodemailer.createTransport({
    host: env.smtpHost,
    port: Number(env.smtpPort),
    secure: env.smtpSecure,
    auth:
      env.smtpUser && env.smtpPass
        ? {
            user: env.smtpUser,
            pass: env.smtpPass,
          }
        : undefined,
  });
  return cachedTransport;
}

function buildWelcomeHtml({ firstName, lastName }) {
  const salutation = firstName ? `Hello ${firstName}${lastName ? ` ${lastName}` : ""},` : "Welcome,";
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Welcome to Invisphere</title>
      <style>
        body { font-family: Arial, Helvetica, sans-serif; background-color: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
        .container { max-width: 640px; margin: auto; padding: 32px 24px; background: linear-gradient(145deg, rgba(15,23,42,0.98), rgba(30,64,175,0.45)); border-radius: 24px; }
        .logo { text-align: center; margin-bottom: 24px; }
        .logo span { display: inline-block; padding: 12px 20px; border-radius: 999px; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.4); color: #bfdbfe; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
        .card { background: rgba(255,255,255,0.03); border-radius: 20px; padding: 24px; border: 1px solid rgba(148,163,184,0.18); box-shadow: 0 24px 60px rgba(15,23,42,0.25); }
        .cta { margin-top: 32px; text-align: center; }
        .cta a { display: inline-block; padding: 12px 28px; border-radius: 999px; background: linear-gradient(135deg,#2563eb,#7c3aed); color: #fff; text-decoration: none; font-weight: 600; }
        .cta p { margin-top: 12px; font-size: 13px; color: rgba(226,232,240,0.7); }
        .footer { margin-top: 32px; font-size: 12px; color: rgba(148,163,184,0.6); text-align: center; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div style="padding: 32px 16px;">
        <div class="container">
          <div class="logo"><span>Invisphere Onboarding</span></div>
          <div class="card">
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">${salutation}</p>
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
              Welcome to Invisphere—your new command center for digital asset intelligence, institutional execution,
              and market-ready analytics. Your workspace is now live with curated data feeds, verified compliance rails, and
              portfolio automation tooling tuned for highly active operators.
            </p>
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
              Your next steps:
            </p>
            <ul style="font-size: 15px; line-height: 1.6; color: rgba(226,232,240,0.9); padding-left: 18px; margin: 0 0 16px;">
              <li>Complete identity verification to unlock institutional funding rails.</li>
              <li>Customize your live market intelligence filters for high-volatility equities.</li>
              <li>Configure treasury policies for automated execution and reporting.</li>
            </ul>
            <p style="font-size: 16px; line-height: 1.6; margin: 0;">
              Our compliance and execution team is available around the clock should you need to coordinate bulk onboarding, risk policy reviews, or integration support.
            </p>
          </div>
          <div class="cta">
            <a href="${env.consoleBaseUrl ?? "https://app.invisphere.com/dashboard"}">Launch Invisphere Console</a>
            <p>Need tailored onboarding? Reply to this email and we will coordinate a white-glove session.</p>
          </div>
          <div class="footer">
            Invisphere Operations Desk · Sent ${new Date().toUTCString()}<br/>
            This notification was sent to you because an Invisphere workspace was created with this email address.
          </div>
        </div>
      </div>
    </body>
  </html>`;
}

export async function sendWelcomeEmail({ to, firstName, lastName }) {
  try {
    const transport = createTransport();
    if (!transport) {
      return false;
    }

    const messageId = crypto.randomUUID();
    await transport.sendMail({
      to,
      from: env.smtpFrom,
      subject: "Welcome to Invisphere",
      html: buildWelcomeHtml({ firstName, lastName }),
      messageId,
    });
    logger.info({ to }, "Welcome email dispatched.");
    return true;
  } catch (error) {
    logger.error({ err: error }, "Failed to send welcome email.");
    return false;
  }
}

function buildPasswordResetHtml({ firstName, resetUrl }) {
  const salutation = firstName ? `Hello ${firstName},` : "Hello,";
  return `<!doctype html><html><body style="font-family: Arial,Helvetica,sans-serif;background:#0f172a;color:#e2e8f0;padding:24px"><div style="max-width:640px;margin:auto;background:#071233;padding:20px;border-radius:12px"><h2 style="color:#fff">Password reset</h2><p style="color:#cbd5e1">${salutation}</p><p style="color:#cbd5e1">We received a request to reset your Invisphere account password. Click the button below to proceed. This link expires in 30 minutes.</p><p style="text-align:center;margin:24px"><a href="${resetUrl}" style="background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Reset password</a></p><p style="color:#94a3b8">If you didn't request a password reset, you can safely ignore this email.</p><p style="color:#94a3b8;margin-top:20px;font-size:12px">Sent ${new Date().toUTCString()}</p></div></body></html>`;
}

export async function sendPasswordResetEmail({ to, firstName, resetUrl }) {
  try {
    const transport = createTransport();
    if (!transport) return false;
    await transport.sendMail({
      to,
      from: env.smtpFrom,
      subject: "Reset your Invisphere password",
      html: buildPasswordResetHtml({ firstName, resetUrl }),
    });
    logger.info({ to }, "Password reset email sent");
    return true;
  } catch (error) {
    logger.error({ err: error }, "Failed to send password reset email");
    return false;
  }
}

function buildPasswordChangeHtml({ firstName }) {
  return `<!doctype html><html><body style="font-family: Arial,Helvetica,sans-serif;background:#0f172a;color:#e2e8f0;padding:24px"><div style="max-width:640px;margin:auto;background:#071233;padding:20px;border-radius:12px"><h2 style="color:#fff">Password changed</h2><p style="color:#cbd5e1">Hello ${firstName ?? ""},</p><p style="color:#cbd5e1">This is a confirmation that your Invisphere account password has been changed. If you did not perform this change, contact support immediately.</p><p style="color:#94a3b8;margin-top:20px;font-size:12px">Sent ${new Date().toUTCString()}</p></div></body></html>`;
}

export async function sendPasswordChangeEmail({ to, firstName }) {
  try {
    const transport = createTransport();
    if (!transport) return false;
    await transport.sendMail({
      to,
      from: env.smtpFrom,
      subject: "Your Invisphere password was changed",
      html: buildPasswordChangeHtml({ firstName }),
    });
    logger.info({ to }, "Password change email sent");
    return true;
  } catch (error) {
    logger.error({ err: error }, "Failed to send password change email");
    return false;
  }
}

export async function sendAdminNotification({ subject, html }) {
  try {
    const transport = createTransport();
    if (!transport) return false;
    // find admin emails from DB lazily to avoid circular imports at module init
    const { UserModel } = await import("../models/User.js");
    const admins = await UserModel.find({ role: "admin", isActive: true }).select("email").lean().exec();
    if (!Array.isArray(admins) || admins.length === 0) return false;
    const toList = admins.map((a) => a.email).join(",");
    await transport.sendMail({
      to: toList,
      from: env.smtpFrom,
      subject: subject ?? "Invisphere admin notification",
      html,
    });
    logger.info({ to: toList }, "Admin notification dispatched.");
    return true;
  } catch (error) {
    logger.error({ err: error }, "Failed to send admin notification email");
    return false;
  }
}
