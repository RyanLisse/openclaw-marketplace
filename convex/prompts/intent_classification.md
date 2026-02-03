# Intent Classification Prompt

## Purpose
Classify user input into one of four intent types. Used by the intent parser to determine appropriate response and data structure.

## Intent Types

### 1. NEED
**Definition:** User is seeking a service, resource, or capability.

**Keywords:**
- need, want, looking for, require, seeking
- help me, assist with, support for
- find someone to, hire for
- budget, willing to pay, offering [amount]

**Characteristics:**
- Describes a problem or gap
- May include compensation details
- Often includes timeline or urgency
- Specifies requirements or constraints

**Edge Cases:**
- "I want to offer" → OFFER (keyword "offer" overrides "want")
- "I need help offering services" → clarify if seeking help (NEED) or offering services (OFFER)
- Vague needs without specifics → REQUEST (too ambiguous for NEED)

---

### 2. OFFER
**Definition:** User is providing a service, resource, or capability.

**Keywords:**
- offer, provide, available for, can do
- I'm good at, expert in, specialize in
- services include, capabilities are
- rates are, charge, pricing

**Characteristics:**
- Describes capabilities or expertise
- May include pricing or availability
- Often includes past work or credentials
- Emphasizes what they deliver

**Edge Cases:**
- "I'm looking for clients" → OFFER (seeking clients = offering services)
- "I can help you find" → OFFER (offering finding service)
- "I need to offer better rates" → NEED (seeking advice about rates)

---

### 3. QUERY
**Definition:** User is asking a question about the marketplace, system, or general information.

**Keywords:**
- how does, what is, can you explain
- is there a way to, where can I
- help understanding, confused about
- question about, wondering if

**Characteristics:**
- Interrogative structure (question marks)
- Seeking information, not action
- No commitment or transaction implied
- May be about platform features

**Edge Cases:**
- "How do I hire someone?" → QUERY (asking about process)
- "Can someone help me with X?" → NEED (requesting service, not asking how)
- "What's your rate?" (in context of offer) → contextual response, not standalone QUERY

---

### 4. COLLABORATION
**Definition:** User is proposing a partnership, co-creation, or mutual exchange.

**Keywords:**
- collaborate, partner with, work together
- joint venture, co-create, team up
- split revenue, equity, profit-share
- mutual benefit, win-win

**Characteristics:**
- Emphasizes shared goals or outcomes
- May propose non-monetary exchange
- Suggests ongoing relationship
- Both parties contribute value

**Edge Cases:**
- "Looking for a partner to hire someone" → NEED (hiring = transaction)
- "Let's team up on this project" → COLLABORATION (mutual contribution)
- "I'll help you if you help me" → COLLABORATION (barter/exchange)

---

## Classification Process

1. **Extract Keywords:** Identify primary action verbs and descriptive terms
2. **Analyze Structure:** Question vs statement, active vs passive voice
3. **Determine Direction:** Seeking (NEED/QUERY) vs providing (OFFER) vs mutual (COLLABORATION)
4. **Resolve Conflicts:** If multiple types match, use priority order: OFFER > COLLABORATION > NEED > QUERY
5. **Validate Specificity:** Vague inputs default to QUERY ("Tell me more about what you're looking for")

---

## Examples

### NEED Examples

1. **Input:** "I need a React developer for my startup, budget $5k/month"
   - **Type:** NEED
   - **Reasoning:** Seeking service, includes budget

2. **Input:** "Looking for someone to design a logo by next week"
   - **Type:** NEED
   - **Reasoning:** Seeking service with deadline

3. **Input:** "Help me automate my email workflow"
   - **Type:** NEED
   - **Reasoning:** Requesting assistance with task

4. **Input:** "Require experienced copywriter, $100/article, 10 articles/month"
   - **Type:** NEED
   - **Reasoning:** Specific service request with compensation

5. **Input:** "Want to find a mentor for TypeScript"
   - **Type:** NEED
   - **Reasoning:** Seeking resource (mentorship)

---

### OFFER Examples

6. **Input:** "I offer TypeScript code reviews, $150/hour"
   - **Type:** OFFER
   - **Reasoning:** Providing service with pricing

7. **Input:** "Available for freelance design work, specializing in Figma"
   - **Type:** OFFER
   - **Reasoning:** Advertising availability and expertise

8. **Input:** "Can help with SEO optimization, proven track record"
   - **Type:** OFFER
   - **Reasoning:** Offering capability with credential

9. **Input:** "Providing AI agent development services"
   - **Type:** OFFER
   - **Reasoning:** Direct service offering

10. **Input:** "I'm a certified scrum master looking for projects"
    - **Type:** OFFER
    - **Reasoning:** Advertising services to potential clients

---

### QUERY Examples

11. **Input:** "How does reputation work in this marketplace?"
    - **Type:** QUERY
    - **Reasoning:** Asking about platform feature

12. **Input:** "What's the difference between needs and offers?"
    - **Type:** QUERY
    - **Reasoning:** Seeking conceptual clarification

13. **Input:** "Can you show me active intents?"
    - **Type:** QUERY
    - **Reasoning:** Requesting information display

14. **Input:** "Is there a fee for posting intents?"
    - **Type:** QUERY
    - **Reasoning:** Question about platform rules

15. **Input:** "How do I accept a match?"
    - **Type:** QUERY
    - **Reasoning:** Asking about process/mechanics

---

### COLLABORATION Examples

16. **Input:** "Let's partner on building a SaaS app, 50/50 equity split"
    - **Type:** COLLABORATION
    - **Reasoning:** Proposing partnership with shared ownership

17. **Input:** "Looking to team up with a designer, I'll handle development"
    - **Type:** COLLABORATION
    - **Reasoning:** Mutual contribution proposal

18. **Input:** "Want to co-create content, you write, I'll promote"
    - **Type:** COLLABORATION
    - **Reasoning:** Complementary skills for joint outcome

19. **Input:** "Joint venture: I have clients, you have product"
    - **Type:** COLLABORATION
    - **Reasoning:** Resource exchange for mutual benefit

20. **Input:** "Revenue share opportunity: bring your marketing, I bring tech"
    - **Type:** COLLABORATION
    - **Reasoning:** Profit-sharing collaboration

---

## Ambiguous Cases & Resolution

| Input | Possible Types | Correct Type | Reason |
|-------|----------------|--------------|--------|
| "I want to hire a developer" | NEED, OFFER | NEED | Hiring = seeking service |
| "Can someone design a logo?" | NEED, QUERY | NEED | Requesting service (rhetorical question) |
| "Looking for design partner" | COLLABORATION, NEED | COLLABORATION | "Partner" implies mutual contribution |
| "I'm available" | OFFER, QUERY | Clarify | Too vague - ask for details |
| "What do you charge?" | QUERY, context-dependent | Context | Follow-up to OFFER = info request |

---

## Output Format

When classifying, return:

```json
{
  "type": "need" | "offer" | "query" | "collaboration",
  "confidence": 0.0 - 1.0,
  "keywords": ["keyword1", "keyword2"],
  "reasoning": "Brief explanation of classification",
  "suggestedClarifications": ["optional", "questions", "if ambiguous"]
}
```

**Confidence Scoring:**
- 0.9-1.0: Unambiguous, multiple strong signals
- 0.7-0.89: Clear type, minor ambiguity
- 0.5-0.69: Leans toward type, needs clarification
- <0.5: Too ambiguous, request more information

---

## Integration Notes

- Used by: `parseAndValidate()` in @openclaw/core
- Replaces: Hardcoded regex patterns in intent parser
- Updates: Add new types or examples as marketplace evolves
- Fallback: If confidence <0.5, treat as QUERY and ask clarifying questions
