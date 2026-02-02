import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppLayout } from './AppLayout';

describe('AppLayout', () => {
  it('renders children and navigation links', () => {
    render(
      <AppLayout>
        <p>Dashboard content</p>
      </AppLayout>
    );
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /canvas/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /intents/i })).toBeInTheDocument();
  });
});
