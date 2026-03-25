import {
  getTreasuryOptions,
  updateTreasuryOptions,
} from "../services/treasuryConfigService.js";
import logger from "../lib/logger.js";

export async function getTreasury(req, res) {
  try {
    const options = await getTreasuryOptions();
    return res.json({ options });
  } catch (error) {
    logger.error({ err: error }, "Failed to fetch treasury options");
    return res.status(500).json({ error: "Failed to fetch treasury options" });
  }
}

export async function updateTreasury(req, res) {
  try {
    const { options } = req.body;
    
    if (!Array.isArray(options)) {
      return res.status(400).json({ error: "Options must be an array" });
    }

    // Validate each option
    for (const opt of options) {
      if (!opt.symbol || !opt.name) {
        return res.status(400).json({ error: "Each option must have symbol and name" });
      }
      if (!opt.addresses || !Array.isArray(opt.addresses) || opt.addresses.length === 0) {
        return res.status(400).json({ error: `${opt.symbol} must have at least one address` });
      }
    }

    await updateTreasuryOptions(options);
    
    logger.info({ admin: req.user.email, count: options.length }, "Treasury options updated");
    
    return res.json({ 
      success: true, 
      message: "Treasury options updated successfully",
      options: await getTreasuryOptions()
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to update treasury options");
    return res.status(500).json({ error: "Failed to update treasury options" });
  }
}
