import '@testing-library/jest-dom';
import { vi } from 'vitest';

const mockPost = vi.fn().mockImplementation(() => Promise.resolve({ data: { message: 'Test response' } }));

vi.mock('axios', () => ({
  default: {
    post: mockPost
  }
})); 