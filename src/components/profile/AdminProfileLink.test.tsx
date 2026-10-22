import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AdminProfileLink } from './AdminProfileLink'

describe('profile admin link', () => {
  it('opens /admin for the master account', () => {
    render(
      <MemoryRouter>
        <AdminProfileLink email="ITSGATSBY@protonmail.com" />
      </MemoryRouter>
    )
    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin')
  })

  it('stays hidden for every other account', () => {
    const { container } = render(
      <MemoryRouter>
        <AdminProfileLink email="new@example.com" />
      </MemoryRouter>
    )
    expect(screen.queryByRole('link', { name: 'Admin' })).toBeNull()
    expect(container).toBeEmptyDOMElement()
  })
})
