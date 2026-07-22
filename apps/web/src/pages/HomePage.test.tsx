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
      screen.getByRole('heading', { name: /move money with confidence/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view transfers/i })).toBeInTheDocument();
  });
});
