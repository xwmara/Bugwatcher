// Runs before every test file.
import '@testing-library/jest-dom/vitest'; // adds matchers like toBeInTheDocument()
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup(); // remove what the previous test rendered
  vi.restoreAllMocks();
});
