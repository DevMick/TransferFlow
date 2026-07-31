import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { HomePage } from './HomePage';

describe('HomePage', () => {
  it('renders the hero heading and CTA', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: /transférez de l'argent/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /virements/i })).toBeInTheDocument();
  });
});
