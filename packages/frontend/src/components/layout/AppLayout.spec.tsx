import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { AppLayout } from './AppLayout';

const client = new ConvexReactClient('https://test.convex.cloud');

describe('AppLayout', () => {
  it('renders children and navigation links', () => {
    render(
      <ConvexProvider client={client}>
        <AppLayout>
          <p>Dashboard content</p>
        </AppLayout>
      </ConvexProvider>
    );
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /canvas/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /intents/i })).toBeInTheDocument();
  });
});
