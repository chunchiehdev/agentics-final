import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

describe('Chat Integration', () => {
  beforeAll(() => {
    // Start the server before tests
    // In a real scenario, you might want to use a test server
    process.env.VITE_API_URL = 'http://localhost:3001';
  });

  it('sends and receives messages through the API', async () => {
    render(<App />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button');

    // Send a message
    await userEvent.type(input, 'Hello, world!');
    fireEvent.click(sendButton);

    // Wait for the message to appear in the chat
    await waitFor(() => {
      expect(screen.getByText('Hello, world!')).toBeInTheDocument();
    });

    // Wait for the echo response
    await waitFor(() => {
      expect(screen.getByText('Echo: Hello, world!')).toBeInTheDocument();
    });
  });

  it('maintains chat history', async () => {
    render(<App />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button');

    // Send multiple messages
    const messages = ['First message', 'Second message', 'Third message'];
    
    for (const msg of messages) {
      await userEvent.type(input, msg);
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText(msg)).toBeInTheDocument();
        expect(screen.getByText(`Echo: ${msg}`)).toBeInTheDocument();
      });
    }

    // Verify all messages are still visible
    messages.forEach(msg => {
      expect(screen.getByText(msg)).toBeInTheDocument();
      expect(screen.getByText(`Echo: ${msg}`)).toBeInTheDocument();
    });
  });
}); 