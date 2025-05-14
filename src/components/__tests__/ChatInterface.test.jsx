import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInterface from '../ChatInterface';
import axios from 'axios';

describe('ChatInterface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chat interface', () => {
    render(<ChatInterface />);
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('sends message when clicking send button', async () => {
    render(<ChatInterface />);
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button');

    await userEvent.type(input, 'Test message');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  it('sends message when pressing Enter', async () => {
    render(<ChatInterface />);
    const input = screen.getByPlaceholderText('Type your message...');

    await userEvent.type(input, 'Test message{enter}');

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  it('does not send empty messages', async () => {
    render(<ChatInterface />);
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button');

    await userEvent.type(input, '   ');
    fireEvent.click(sendButton);

    expect(screen.queryByText('   ')).not.toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    axios.default.post.mockImplementationOnce(() => Promise.reject(new Error('API Error')));

    render(<ChatInterface />);
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button');

    await userEvent.type(input, 'Test message');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to send message. Please try again.')).toBeInTheDocument();
    });
  });
}); 