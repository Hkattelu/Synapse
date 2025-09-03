import { vi } from 'vitest';

/**
 * Patch the next created <input type="file"> so tests can deterministically
 * provide a File without brittle, ad-hoc monkey-patching.
 *
 * Returns the patched input element and a restore() function that must be
 * called after dispatching the 'change' event to avoid cross-test leakage.
 */
export function patchNextFileInput(file: File): {
  input: HTMLInputElement;
  restore: () => void;
} {
  const input = document.createElement('input');
  input.type = 'file';
  // Define files as a read-only FileList using DataTransfer for compatibility
  Object.defineProperty(input, 'files', {
    configurable: true,
    get: () => {
      const dt = new DataTransfer();
      dt.items.add(file);
      return dt.files;
    },
  });

  const origCreate = HTMLDocument.prototype.createElement;
  let used = false;
  const spy = vi
    .spyOn(document, 'createElement')
    .mockImplementation(
      (...args: Parameters<typeof document.createElement>) => {
        const [tagName] = args;
        if (!used && tagName.toLowerCase() === 'input') {
          used = true;
          return input as ReturnType<typeof document.createElement>;
        }
        return origCreate.call(document, ...args) as ReturnType<
          typeof document.createElement
        >;
      }
    );

  return {
    input,
    restore: () => {
      spy.mockRestore();
    },
  };
}
