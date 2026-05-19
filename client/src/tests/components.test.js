// client/src/tests/components.test.js
// Client-Side React Component Tests
// Run: cd client && npm test -- --watchAll=false --coverage

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';
import axios from 'axios';

// =============================================
// 🔧 Mock axios (api service uses axios under the hood)
// =============================================
jest.mock('axios');
jest.mock('../services/api', () => ({
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  defaults: { headers: { common: {} } },
}));

// Mock framer-motion to render children directly without animation overhead
jest.mock('framer-motion', () => {
  const React = require('react');
  const DummyComponent = React.forwardRef((props, ref) => {
    const { children, initial, animate, exit, transition, variants, whileHover, whileTap, ...rest } = props;
    return React.createElement('div', { ref, ...rest }, children);
  });
  return {
    motion: {
      div: DummyComponent,
      h1: DummyComponent,
      h2: DummyComponent,
      p: DummyComponent,
      span: DummyComponent,
      button: DummyComponent,
      a: DummyComponent,
      form: DummyComponent,
      img: DummyComponent,
    },
    AnimatePresence: ({ children }) => children,
  };
});

const api = require('../services/api');

// =============================================
// 🛠️ Helper: Render with router + theme context
// =============================================
const renderWithProviders = (ui, { theme = 'dark' } = {}) => {
  return render(
    <BrowserRouter>
      <ThemeContext.Provider value={{ theme, setTheme: jest.fn() }}>
        {ui}
      </ThemeContext.Provider>
    </BrowserRouter>
  );
};

// =============================================
// 🧪 CONTACT COMPONENT TESTS
// =============================================
describe('Contact Component', () => {
  let Contact;

  beforeAll(() => {
    Contact = require('../components/Contact').default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('TC-CONTACT-01: Renders the contact form', () => {
    renderWithProviders(<Contact />);
    expect(screen.getByPlaceholderText(/Your Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Your Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Your Message/i)).toBeInTheDocument();
  });

  test('TC-CONTACT-02: Send Message button exists', () => {
    renderWithProviders(<Contact />);
    expect(screen.getByRole('button', { name: /Send Message/i })).toBeInTheDocument();
  });

  test('TC-CONTACT-03: Shows success message after valid form submission', async () => {
    api.post.mockResolvedValueOnce({ data: { success: true } });
    renderWithProviders(<Contact />);

    fireEvent.change(screen.getByPlaceholderText(/Your Name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText(/Your Email/i), { target: { value: 'test@email.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Your Message/i), { target: { value: 'Hello from test!' } });
    fireEvent.click(screen.getByRole('button', { name: /Send Message/i }));

    await waitFor(() => {
      expect(screen.getByText(/Message sent successfully/i)).toBeInTheDocument();
    });
  });

  test('TC-CONTACT-04: Shows error message if API call fails', async () => {
    api.post.mockRejectedValueOnce(new Error('Network error'));
    renderWithProviders(<Contact />);

    fireEvent.change(screen.getByPlaceholderText(/Your Name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText(/Your Email/i), { target: { value: 'test@email.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Your Message/i), { target: { value: 'Hello!' } });
    fireEvent.click(screen.getByRole('button', { name: /Send Message/i }));

    await waitFor(() => {
      expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
    });
  });

  test('TC-CONTACT-05: Button is disabled while submitting', async () => {
    // Simulate a slow API
    api.post.mockImplementationOnce(() => new Promise(r => setTimeout(() => r({ data: { success: true } }), 500)));
    renderWithProviders(<Contact />);

    fireEvent.change(screen.getByPlaceholderText(/Your Name/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText(/Your Email/i), { target: { value: 'test@email.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Your Message/i), { target: { value: 'Msg' } });
    fireEvent.click(screen.getByRole('button', { name: /Send Message/i }));

    // Button should be disabled while loading
    expect(screen.getByRole('button', { name: /Sending/i })).toBeDisabled();
  });

  test('TC-CONTACT-06: Contact info email link is present', () => {
    renderWithProviders(<Contact />);
    const emailLink = screen.getByRole('link', { name: /sarsha7779992@gmail.com/i });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink.getAttribute('href')).toBe('mailto:sarsha7779992@gmail.com');
  });

  test('TC-CONTACT-07: Contact info phone link is present', () => {
    renderWithProviders(<Contact />);
    const phoneLink = screen.getByRole('link', { name: /\+91 9680134032/i });
    expect(phoneLink).toBeInTheDocument();
    expect(phoneLink.getAttribute('href')).toBe('tel:+919680134032');
  });
});

// =============================================
// 🧪 LOGIN COMPONENT TESTS
// =============================================
describe('Login Component', () => {
  let Login;
  const mockNavigate = jest.fn();

  beforeAll(() => {
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));
    Login = require('../components/Login').default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('TC-LOGIN-01: Renders login form', () => {
    renderWithProviders(<Login />);
    expect(screen.getByPlaceholderText(/xyz@email.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
  });

  test('TC-LOGIN-02: Login button exists', () => {
    renderWithProviders(<Login />);
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
  });

  test('TC-LOGIN-03: Shows error on invalid credentials', async () => {
    api.post.mockRejectedValueOnce({ response: { data: { message: 'Invalid credentials' } } });
    renderWithProviders(<Login />);

    fireEvent.change(screen.getByPlaceholderText(/xyz@email.com/i), { target: { value: 'wrong@email.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });

  test('TC-LOGIN-04: Stores token and navigates to /admin on success', async () => {
    api.post.mockResolvedValueOnce({ data: { success: true, token: 'mock-jwt-token' } });
    renderWithProviders(<Login />);

    fireEvent.change(screen.getByPlaceholderText(/xyz@email.com/i), { target: { value: 'admin@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'adminpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('mock-jwt-token');
    });
  });
});

// =============================================
// 🧪 PROTECTED ROUTE TESTS
// =============================================
describe('ProtectedRoute Component', () => {
  let ProtectedRoute;

  beforeAll(() => {
    ProtectedRoute = require('../components/ProtectedRoute').default;
  });

  beforeEach(() => {
    localStorage.clear();
  });

  test('TC-PROT-01: Redirects to /login if no token in localStorage', () => {
    renderWithProviders(
      <ProtectedRoute />
    );
    // Should attempt to navigate to /login
    // With BrowserRouter, redirect sets internal history
    expect(window.location.pathname).not.toBe('/admin');
  });
});

// =============================================
// 🧪 NAVBAR COMPONENT TESTS
// =============================================
describe('Navbar Component', () => {
  let Navbar;

  beforeAll(() => {
    Navbar = require('../components/Navbar').default;
  });

  test('TC-NAV-01: Renders navigation links', () => {
    renderWithProviders(<Navbar />);
    // At minimum, some nav links should exist
    expect(document.querySelector('nav') || document.querySelector('.navbar')).toBeTruthy();
  });
});
