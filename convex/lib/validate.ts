import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Validation utility using configurable rules from configs table.
 * Loads validation_rules config for dynamic constraints.
 */

export const validateIntent = query({
    args: {
        title: v.string(),
        description: v.string(),
        skills: v.array(v.string()),
        amount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Load validation rules from configs
        const config = await ctx.db
            .query("configs")
            .filter((q) => q.eq(q.field("key"), "validation_rules"))
            .first();
        
        // Defaults if config not found
        const rules = config?.value ?? {
            title_max_length: 200,
            description_max_length: 5000,
            min_skills: 1,
            max_skills: 20,
            min_amount: 0,
        };
        
        const errors: Array<{ field: string; message: string }> = [];
        
        // Title validation
        if (!args.title || args.title.trim().length === 0) {
            errors.push({ field: "title", message: "Title is required" });
        } else if (args.title.length > rules.title_max_length) {
            errors.push({
                field: "title",
                message: `Title must be ${rules.title_max_length} characters or less (current: ${args.title.length})`,
            });
        }
        
        // Description validation
        if (!args.description || args.description.trim().length === 0) {
            errors.push({ field: "description", message: "Description is required" });
        } else if (args.description.length > rules.description_max_length) {
            errors.push({
                field: "description",
                message: `Description must be ${rules.description_max_length} characters or less (current: ${args.description.length})`,
            });
        }
        
        // Skills validation
        if (args.skills.length < rules.min_skills) {
            errors.push({
                field: "skills",
                message: `At least ${rules.min_skills} skill(s) required (current: ${args.skills.length})`,
            });
        }
        if (args.skills.length > rules.max_skills) {
            errors.push({
                field: "skills",
                message: `Maximum ${rules.max_skills} skills allowed (current: ${args.skills.length})`,
            });
        }
        
        // Amount validation
        if (args.amount !== undefined && args.amount < rules.min_amount) {
            errors.push({
                field: "amount",
                message: `Amount must be at least ${rules.min_amount}`,
            });
        }
        
        return {
            valid: errors.length === 0,
            errors,
        };
    },
});
