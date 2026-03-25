import { SiteContentModel } from "../models/SiteContent.js";

function normalizeLocale(locale) {
  return (locale || "en").toLowerCase();
}

export async function getSiteContent(req, res) {
  try {
    const locale = normalizeLocale(req.query.locale);
    const fallbackLocale = normalizeLocale(req.query.fallback ?? "en");

    const [primaryEntries, fallbackEntries] = await Promise.all([
      SiteContentModel.find({ locale }).lean().exec(),
      locale === fallbackLocale ? [] : SiteContentModel.find({ locale: fallbackLocale }).lean().exec(),
    ]);

    const entriesMap = new Map();
    for (const entry of fallbackEntries) {
      entriesMap.set(entry.key, entry);
    }
    for (const entry of primaryEntries) {
      entriesMap.set(entry.key, entry);
    }

    const payload = Array.from(entriesMap.values()).map((entry) => ({
      id: entry._id,
      key: entry.key,
      locale: entry.locale,
      value: entry.value,
      description: entry.description ?? "",
      updatedAt: entry.updatedAt,
      createdAt: entry.createdAt,
    }));

    res.json({
      locale,
      fallbackLocale,
      entries: payload,
    });
  } catch (error) {
    console.error("Failed to fetch site content", error);
    res.status(500).json({ error: "Unable to load site content" });
  }
}
