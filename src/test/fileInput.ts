import { vi } from 'vitest';

export type PatchedFileInputHandle = {
  input: HTMLInputElement;
  restore: () => void;
};

/**
* Patch the next created HTMLInputElement (type="file") and preset its `files` list.
* Returns the input element that will be returned by the next `document.createElement('input')`
* call and a `restore()` function to fully restore the original behavior.
*
* - No properties are written onto `document.createElement` (avoids cross‑test leakage).
* - The spy intercepts exactly once for an 'input' tag, then defers to the original.
*/
export function patchNextFileInput(file: File | File[]): PatchedFileInputHandle {
  const files = Array.isArray(file) ? file : [file];

  // Capture the original (bound) createElement to avoid losing `this`.
  const originalCreateElement = document.createElement.bind(document);

  // Create the input up front using the original createElement so it's a real element.
  const input = originalCreateElement('input') as HTMLInputElement;
  input.type = 'file';

  // Define a read-only `files` accessor that returns our provided files.
  Object.defineProperty(input, 'files', {
    configurable: true,
    enumerable: true,
    get: () => files as unknown as FileList,
  });

  let used = false;
  const spy = vi.spyOn(document, 'createElement').mockImplementation(
    (tagName: string, options?: ElementCreationOptions): HTMLElement => {
      if (!used && typeof tagName === 'string' && tagName.toLowerCase() === 'input') {
        used = true;
        return input as unknown as HTMLElement;
      }
      // Delegate to the original (bound) implementation for all other elements
      return originalCreateElement(tagName as any, options as any) as unknown as HTMLElement;
    }
  );

  return {
    input,
    restore: () => {
      spy.mockRestore();
    },
  };
}
