import mongoose from "mongoose";
import { SiteContentModel } from "../models/SiteContent.js";
import { AuditLogModel } from "../models/AuditLog.js";

function normalizeLocale(locale) {
  return (locale || "en").toLowerCase();
}

function buildContentResponse(entry) {
  return {
    id: entry._id,
    key: entry.key,
    locale: entry.locale,
    value: entry.value,
    description: entry.description ?? "",
    tags: entry.tags ?? [],
    updatedAt: entry.updatedAt,
    createdAt: entry.createdAt,
    lastEditedBy: entry.lastEditedBy
      ? {
          id: entry.lastEditedBy._id,
          firstName: entry.lastEditedBy.firstName,
          lastName: entry.lastEditedBy.lastName,
          email: entry.lastEditedBy.email,
        }
      : null,
  };
}

export async function listSiteContent(req, res) {
  try {
    const locale = req.query.locale ? normalizeLocale(req.query.locale) : undefined;
    const filter = locale ? { locale } : {};

    const entries = await SiteContentModel.find(filter)
      .sort({ key: 1, locale: 1 })
      .populate("lastEditedBy", "firstName lastName email")
      .lean()
      .exec();

    res.json({
      locale: locale ?? null,
      entries: entries.map(buildContentResponse),
    });
  } catch (error) {
    console.error("listSiteContent error", error);
    res.status(500).json({ error: "Unable to load site content entries" });
  }
}

export async function upsertSiteContent(req, res) {
  try {
    const { key } = req.params;
    const { value, locale, description, tags } = req.body;
    if (!key) {
      return res.status(400).json({ error: "Key is required" });
    }
    if (typeof value !== "string" || !value.trim()) {
      return res.status(400).json({ error: "Value must be a non-empty string" });
    }

    const normalizedLocale = normalizeLocale(locale);

    const update = {
      value,
      locale: normalizedLocale,
      description: description ?? "",
      tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
      lastEditedBy: req.admin?._id ?? null,
    };

    const options = {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    };

    const entry = await SiteContentModel.findOneAndUpdate({ key, locale: normalizedLocale }, { $set: update }, options)
      .populate("lastEditedBy", "firstName lastName email")
      .exec();

    if (req.admin?._id instanceof mongoose.Types.ObjectId) {
      await AuditLogModel.create({
        action: "CONTENT_UPDATE",
        adminId: req.admin._id,
        targetUserId: req.admin._id,
        changes: { key, locale: normalizedLocale, value },
      });
    }

    res.json(buildContentResponse(entry));
  } catch (error) {
    console.error("upsertSiteContent error", error);
    res.status(500).json({ error: "Unable to save site content entry" });
  }
}
