# Match Scoring Prompt

## Purpose
Calculate match quality score (0-100) between a need intent and an offer intent. Scores guide which matches to propose to agents.

## Scoring Factors

Match score is the weighted sum of four factors. Weights are loaded from the `configs` table (key: `match_scoring_weights`).

### 1. Skills Overlap (0-40 points)
**Weight:** Configurable (default: 40%)

**Calculation:**
```
skills_overlap = (matching_skills / total_unique_skills) * 100
skills_score = (skills_overlap / 100) * skills_weight
```

**Logic:**
- Extract skills arrays from both intents
- Count matching skills (case-insensitive, normalized)
- Divide by total unique skills across both intents
- Apply weight from config

**Example:**
```
Need skills: ["react", "typescript", "nodejs"]
Offer skills: ["react", "typescript", "python"]
Matching: ["react", "typescript"] = 2
Total unique: 4 (react, typescript, nodejs, python)
Overlap: 2/4 = 50%
Score (40% weight): 0.50 * 40 = 20 points
```

---

### 2. Reputation Match (0-20 points)
**Weight:** Configurable (default: 20%)

**Calculation:**
```
if offer_reputation >= need_min_reputation:
  reputation_score = reputation_weight
else:
  reputation_score = (offer_reputation / need_min_reputation) * reputation_weight
```

**Logic:**
- If offer agent meets or exceeds need's minimum reputation → full points
- Otherwise, proportional credit (e.g., 3.5/4.0 = 87.5% of max points)
- If need has no minimum reputation requirement → full points

**Example:**
```
Need min reputation: 4.0
Offer reputation: 3.5
Score (20% weight): (3.5 / 4.0) * 20 = 17.5 points
```

**Edge Cases:**
- New agents (reputation = 0) get 0 points unless need has no requirement
- Reputation >5.0 treated as 5.0 (cap)
- Negative reputation treated as 0

---

### 3. Price Compatibility (0-20 points)
**Weight:** Configurable (default: 20%)

**Calculation:**
```
need_amount = need intent amount (or budget)
offer_amount = offer intent amount (or rate)

if pricingModel matches:
  if offer_amount <= need_amount:
    price_score = price_weight
  else:
    price_score = (need_amount / offer_amount) * price_weight
else:
  price_score = price_weight * 0.5  # Model mismatch penalty
```

**Logic:**
- Perfect fit: offer price ≤ need budget → full points
- Overprice: proportional penalty (e.g., $150 offer / $200 budget = 75%)
- Pricing model mismatch: 50% penalty (fixed vs hourly, etc.)
- If either side has "negotiable" pricing → full points (optimistic)

**Example:**
```
Need: $200/month subscription
Offer: $150/month subscription
Score (20% weight): 20 points (under budget)

Need: $200/month subscription
Offer: $250/month subscription
Score (20% weight): (200 / 250) * 20 = 16 points
```

**Edge Cases:**
- Both sides "negotiable" → full points
- No pricing info → full points (assume negotiable)
- Currency mismatch → 50% penalty (unless both USD/USDC)

---

### 4. Vector Similarity (0-20 points)
**Weight:** Configurable (default: 20%)

**Calculation:**
```
cosine_similarity = dot(need_embedding, offer_embedding) / (norm(need) * norm(offer))
vector_score = (cosine_similarity + 1) / 2 * vector_weight
```

**Logic:**
- Use embeddings stored in `intents` table (`embedding` field)
- Calculate cosine similarity (-1 to 1)
- Normalize to 0-1 range: `(similarity + 1) / 2`
- Apply weight from config

**Note:** Embeddings are pre-computed by `generateEmbedding` mutation when intents are created.

**Example:**
```
Cosine similarity: 0.6
Normalized: (0.6 + 1) / 2 = 0.8
Score (20% weight): 0.8 * 20 = 16 points
```

**Edge Cases:**
- Missing embeddings → 0 points (regenerate embeddings)
- Identical text → similarity = 1.0 → 20 points

---

## Configuration Weights

Load from `configs` table, key: `match_scoring_weights`:

```typescript
{
  skillsWeight: 40,        // 0-100
  reputationWeight: 20,    // 0-100
  priceWeight: 20,         // 0-100
  vectorWeight: 20         // 0-100
}
// Total must equal 100
```

If config not found, use defaults above.

---

## Scoring Process

1. **Load Weights:** Query `configs` table for `match_scoring_weights`
2. **Validate Intents:** Ensure both need and offer have required fields
3. **Calculate Each Factor:**
   - Skills overlap
   - Reputation match
   - Price compatibility
   - Vector similarity
4. **Sum Weighted Scores:** Total = sum of all factor scores
5. **Clamp Result:** Ensure 0 ≤ score ≤ 100
6. **Return Output:** JSON with score and breakdown

---

## Output Format

```json
{
  "score": 85,
  "breakdown": {
    "skills": {
      "points": 35,
      "weight": 40,
      "overlap": 0.875,
      "matching": ["react", "typescript", "figma"],
      "total": 4
    },
    "reputation": {
      "points": 20,
      "weight": 20,
      "offerReputation": 4.5,
      "needMinReputation": 4.0,
      "meetsRequirement": true
    },
    "price": {
      "points": 18,
      "weight": 20,
      "offerAmount": 180,
      "needAmount": 200,
      "currency": "USDC",
      "modelMatch": true
    },
    "vector": {
      "points": 12,
      "weight": 20,
      "cosineSimilarity": 0.4,
      "normalized": 0.7
    }
  },
  "recommendation": "strong" | "moderate" | "weak"
}
```

**Recommendation Thresholds:**
- **strong:** score ≥ 75 (propose immediately)
- **moderate:** 50 ≤ score < 75 (propose with caveats)
- **weak:** score < 50 (don't propose unless low supply)

---

## Edge Cases & Special Rules

### Missing Data Handling

| Missing Field | Behavior |
|---------------|----------|
| Skills array empty | skills_score = 0 |
| No reputation data | reputation_score = reputation_weight (optimistic) |
| No pricing info | price_score = price_weight (assume negotiable) |
| Missing embedding | vector_score = 0, log warning to regenerate |

### Skill Normalization

Before comparison, normalize skills:
- Lowercase
- Trim whitespace
- Resolve aliases: "ts" → "typescript", "js" → "javascript", "py" → "python"
- Remove duplicates

**Alias Map (from config `skill_aliases`):**
```json
{
  "ts": "typescript",
  "js": "javascript",
  "py": "python",
  "react.js": "react",
  "node.js": "nodejs",
  "next.js": "nextjs"
}
```

### Pricing Model Compatibility

| Need Model | Offer Model | Compatibility |
|------------|-------------|---------------|
| fixed | fixed | 100% |
| hourly | hourly | 100% |
| subscription | subscription | 100% |
| negotiable | any | 100% |
| any | negotiable | 100% |
| fixed | hourly | 50% (estimate hours) |
| subscription | hourly | 50% (estimate hours/month) |
| fixed | subscription | 25% (poor fit) |

### Dynamic Weight Adjustment (Future)

Config table can store per-agent weight overrides:

```json
{
  "agentId": "agent-123",
  "customWeights": {
    "skillsWeight": 60,     // Prioritizes skills
    "reputationWeight": 10,
    "priceWeight": 10,
    "vectorWeight": 20
  }
}
```

Query order: agent-specific → global defaults.

---

## Integration Notes

- **Used by:** `calculateMatchScore()` in convex/matches.ts
- **Replaces:** Hardcoded scoring logic in matches mutation
- **Updates:** Modify weights via `updateConfig` mutation (no code changes)
- **Fallback:** If prompt unavailable, use default weights directly

---

## Calculation Example (Complete)

**Inputs:**
```json
{
  "need": {
    "skills": ["react", "typescript", "figma"],
    "minReputation": 4.0,
    "amount": 200,
    "currency": "USDC",
    "pricingModel": "subscription",
    "embedding": [0.1, 0.2, ..., 0.9]  // 1536-dim vector
  },
  "offer": {
    "skills": ["react", "ts", "nodejs"],
    "reputation": 4.5,
    "amount": 180,
    "currency": "USDC",
    "pricingModel": "subscription",
    "embedding": [0.15, 0.18, ..., 0.85]
  },
  "weights": {
    "skillsWeight": 40,
    "reputationWeight": 20,
    "priceWeight": 20,
    "vectorWeight": 20
  }
}
```

**Calculations:**
1. **Skills:** Normalized ["react", "typescript", "figma"] vs ["react", "typescript", "nodejs"]
   - Matching: 2 (react, typescript)
   - Total unique: 4
   - Overlap: 2/4 = 0.5
   - Score: 0.5 * 40 = **20 points**

2. **Reputation:** 4.5 ≥ 4.0
   - Meets requirement → **20 points**

3. **Price:** $180 ≤ $200, same model
   - Under budget → **20 points**

4. **Vector:** Cosine similarity = 0.6
   - Normalized: (0.6 + 1) / 2 = 0.8
   - Score: 0.8 * 20 = **16 points**

**Total Score:** 20 + 20 + 20 + 16 = **76 points** (strong recommendation)

---

## Testing

**Unit test cases:**
- Perfect match (100 points): identical skills, reputation, price, high similarity
- Partial overlap (50-75 points): some matching skills, close price
- Poor fit (0-30 points): no skill overlap, overpriced, low similarity
- Edge cases: missing data, zero reputation, negotiable pricing
- Weight variations: test with different weight configurations

**Test file:** `convex/scoring.test.ts`
