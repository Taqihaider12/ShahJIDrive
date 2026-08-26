import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', authenticateToken, (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const promptLower = prompt.toLowerCase();

  let category = 'Educational Course';
  let brand = 'ShahJI Academy';
  let title = 'Complete Mastery Course';
  let tagline = 'The premium learning experience';
  let body_text = 'A comprehensive set of materials curated for accelerated learning.';
  let channel_link = 'https://whatsapp.com/channel/0029Va9aEMP';

  if (promptLower.includes('forex') || promptLower.includes('trading') || promptLower.includes('crypto') || promptLower.includes('finance') || promptLower.includes('stock') || promptLower.includes('market')) {
    category = 'Finance / Trading';
    brand = 'Alpha Trading Club';
    title = 'Forex & Crypto Trading Mastery';
    tagline = 'Master the charts, control your financial destiny';
    body_text = 'A premium guide to technical analysis, price action setups, indicator systems, and strict risk management rules.';
    channel_link = 'https://whatsapp.com/channel/0029Va9aFXE';
  } else if (promptLower.includes('program') || promptLower.includes('code') || promptLower.includes('python') || promptLower.includes('javascript') || promptLower.includes('web') || promptLower.includes('tech')) {
    category = 'Programming / Tech';
    brand = 'Code Crafters';
    title = 'Full-Stack Software Engineering';
    tagline = 'Write clean code, build real projects, scale systems';
    body_text = 'Learn production-grade architecture patterns, database design, API design, and frontend design guidelines.';
    channel_link = 'https://whatsapp.com/channel/0029Va9aDEV';
  } else if (promptLower.includes('design') || promptLower.includes('figma') || promptLower.includes('ux') || promptLower.includes('ui') || promptLower.includes('creative')) {
    category = 'Design / Creative';
    brand = 'Pixel Academy';
    title = 'Figma UI/UX & Design Systems';
    tagline = 'Design beautiful interfaces that capture user attention';
    body_text = 'A detailed compilation of visual design theories, layout constraints, spatial design guides, and micro-interactions.';
    channel_link = 'https://whatsapp.com/channel/0029Va9aDSN';
  } else if (promptLower.includes('market') || promptLower.includes('business') || promptLower.includes('sales') || promptLower.includes('ads') || promptLower.includes('seo')) {
    category = 'Business / Marketing';
    brand = 'Growth Engine';
    title = 'Digital Marketing & Conversion Optimization';
    tagline = 'Scale your customer acquisition and dominate your niche';
    body_text = 'A complete blueprint for organic SEO traffic, paid ad campaigns, psychographic hooks, and conversion triggers.';
    channel_link = 'https://whatsapp.com/channel/0029Va9aMKT';
  } else if (promptLower.includes('health') || promptLower.includes('fitness') || promptLower.includes('diet') || promptLower.includes('gym')) {
    category = 'Health / Fitness';
    brand = 'FitLife Labs';
    title = 'Optimal Fitness & Metabolic Blueprint';
    tagline = 'Transform your body, optimize your nutrition, build strength';
    body_text = 'A science-backed guide to functional workout routines, macronutrient split formulas, and continuous energy regulation.';
    channel_link = 'https://whatsapp.com/channel/0029Va9aFIT';
  }

  // If the prompt mentions a specific name or title, try to override
  // e.g. "by Alex"
  const brandMatch = prompt.match(/by\s+([A-Za-z0-9\s]+)/i);
  if (brandMatch) {
    brand = brandMatch[1].trim() + ' Academy';
  }

  return res.json({
    brand,
    title,
    tagline,
    body_text,
    category,
    channel_link
  });
});

export default router;
