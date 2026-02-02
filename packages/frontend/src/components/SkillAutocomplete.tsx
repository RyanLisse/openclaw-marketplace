'use client';

import { useState, useRef, useEffect } from 'react';
import taxonomy from '@/data/skill-taxonomy.json';

type SkillTaxonomy = {
  categories: { id: string; name: string; skills: string[] }[];
};

const typedTaxonomy = taxonomy as SkillTaxonomy;

const allSkills = typedTaxonomy.categories.flatMap((c) =>
  c.skills.map((s) => ({ skill: s.toLowerCase(), category: c.name }))
);

function matchSkills(query: string, exclude: string[], limit = 8) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const excluded = new Set(exclude.map((s) => s.toLowerCase()));
  const matches = allSkills
    .filter(
      ({ skill }) =>
        !excluded.has(skill) &&
        (skill.includes(q) || skill.startsWith(q) || q.split(/\s+/).some((w) => skill.includes(w)))
    )
    .slice(0, limit)
    .map(({ skill, category }) => ({ skill, category }));
  return [...new Map(matches.map((m) => [m.skill, m])).values()];
}

type SkillAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  selectedSkills: string[];
  placeholder?: string;
};

export function SkillAutocomplete({
  value,
  onChange,
  selectedSkills,
  placeholder = 'e.g. research, ai, summarization',
}: SkillAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<{ skill: string; category: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const m = matchSkills(value, selectedSkills);
    setSuggestions(m);
    setHighlight(0);
    setOpen(m.length > 0);
  }, [value, selectedSkills]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function select(skill: string) {
    const next = selectedSkills.includes(skill)
      ? selectedSkills
      : [...selectedSkills, skill];
    onChange(next.join(', '));
    setOpen(false);
    setSuggestions([]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && suggestions[highlight]) {
      e.preventDefault();
      select(suggestions[highlight].skill);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-500"
      />
      {open && suggestions.length > 0 && (
        <ul
          className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-600 bg-gray-800 py-1 shadow-lg"
          role="listbox"
        >
          {suggestions.map(({ skill, category }, i) => (
            <li
              key={skill}
              role="option"
              aria-selected={i === highlight}
              className={`cursor-pointer px-3 py-2 text-sm ${
                i === highlight ? 'bg-emerald-600/30 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => select(skill)}
              onMouseEnter={() => setHighlight(i)}
            >
              <span className="font-medium">{skill}</span>
              <span className="ml-2 text-xs text-gray-500">{category}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
