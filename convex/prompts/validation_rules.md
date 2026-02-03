# Validation rules

Load from configs (validation_rules): title_max (default 200), desc_max (5000), min_skills (1).

Rules: title required, length <= title_max; description required, length <= desc_max; skills array length >= min_skills; amount >= 0 if present.

Output: { valid: boolean, errors: { field, message }[] }.
