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
      // JSDOM may not provide DataTransfer; fall back to a minimal FileList-like object
      const DT: any = (globalThis as any).DataTransfer;
      if (typeof DT === 'function') {
        const dt = new DT();
        dt.items.add(file);
        return dt.files as FileList;
      }
      const fallback: any = {
        0: file,
        length: 1,
        item: (i: number) => (i === 0 ? file : null),
      };
      return fallback as FileList;
    },
  });

  const origCreate = document.createElement.bind(document);
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

  // Minimal URL.createObjectURL polyfill for JSDOM
  if (typeof (globalThis as any).URL !== 'undefined') {
    if (typeof (globalThis as any).URL.createObjectURL !== 'function') {
      (globalThis as any).URL.createObjectURL = () => 'blob:mock-url';
    }
    if (typeof (globalThis as any).URL.revokeObjectURL !== 'function') {
      (globalThis as any).URL.revokeObjectURL = () => {};
    }
  }

  return {
    input,
    restore: () => {
      spy.mockRestore();
    },
  };
}
