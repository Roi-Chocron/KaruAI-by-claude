-- More per-day usage (see worker/src/db.ts): what the AI calls used and cost (input, output including thinking, and
-- cached tokens; cost in millionths of a dollar, from shared/ai-pricing.ts), AI replies blocked by safety filters,
-- exports done in the editor, and requests refused because the plan's monthly limit was used up.
ALTER TABLE usage_daily ADD COLUMN input_tokens INTEGER NOT NULL DEFAULT 0;
ALTER TABLE usage_daily ADD COLUMN output_tokens INTEGER NOT NULL DEFAULT 0;
ALTER TABLE usage_daily ADD COLUMN cached_tokens INTEGER NOT NULL DEFAULT 0;
ALTER TABLE usage_daily ADD COLUMN cost_micro_usd INTEGER NOT NULL DEFAULT 0;
ALTER TABLE usage_daily ADD COLUMN blocked_requests INTEGER NOT NULL DEFAULT 0;
ALTER TABLE usage_daily ADD COLUMN exports INTEGER NOT NULL DEFAULT 0;
ALTER TABLE usage_daily ADD COLUMN quota_hits INTEGER NOT NULL DEFAULT 0;
