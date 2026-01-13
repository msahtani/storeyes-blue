/**
 * Utilities for sanitizing payloads before passing to native code.
 * Prevents iOS crashes caused by undefined → nil bridging issues.
 * 
 * The iOS native bridge cannot handle `undefined` values - they become `nil`
 * and cause crashes like "attempt to insert nil object from objects[X]"
 * when inserted into NSDictionary.
 */

type SanitizeOptions = {
  /** If true, removes keys with undefined values instead of converting to null */
  removeUndefined?: boolean;
  /** If true, converts null string values to empty strings */
  nullToEmpty?: boolean;
};

/**
 * Recursively sanitizes an object to be iOS-safe by converting
 * undefined values to null (or removing them) and ensuring no
 * nil-equivalent values get passed to native code.
 * 
 * @example
 * const payload = { name: "Test", value: undefined, nested: { foo: undefined } };
 * const safe = sanitizeForNative(payload);
 * // Result: { name: "Test", value: null, nested: { foo: null } }
 */
export function sanitizeForNative<T extends Record<string, unknown>>(
  payload: T,
  options: SanitizeOptions = {}
): T {
  const { removeUndefined = false, nullToEmpty = false } = options;

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) {
      if (!removeUndefined) {
        result[key] = null; // Convert undefined to null for iOS safety
      }
      // If removeUndefined is true, we simply skip this key
    } else if (value === null) {
      result[key] = null;
    } else if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      result[key] = sanitizeForNative(value as Record<string, unknown>, options);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? sanitizeForNative(item as Record<string, unknown>, options)
          : item === undefined
          ? null
          : item
      );
    } else if (typeof value === 'string' && value === '' && nullToEmpty) {
      result[key] = '';
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Ensures a URI is safe to pass to native Image/Video components.
 * Returns null if the URI is invalid, allowing callers to handle gracefully.
 * 
 * @example
 * const uri = safeUri(maybeUndefinedUrl);
 * if (uri) {
 *   player.replace({ uri });
 * }
 */
export function safeUri(uri: string | null | undefined): string | null {
  if (uri && typeof uri === 'string' && uri.trim().length > 0) {
    return uri;
  }
  return null;
}

/**
 * Creates a safe image source object for React Native Image component.
 * Returns undefined if URI is invalid (allowing fallback rendering).
 * 
 * @example
 * <Image source={safeImageSource(imageUrl)} />
 * // If imageUrl is undefined/null/empty, source will be undefined
 * // causing Image to not render (or use defaultSource)
 */
export function safeImageSource(
  uri: string | null | undefined
): { uri: string } | undefined {
  const safe = safeUri(uri);
  return safe ? { uri: safe } : undefined;
}

/**
 * Type guard to check if a value is a valid non-empty string.
 * Useful for conditional rendering and native code safety.
 * 
 * @example
 * if (isValidString(url)) {
 *   player.replace({ uri: url }); // TypeScript knows url is string
 * }
 */
export function isValidString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Sanitizes navigation params to ensure no undefined values are passed.
 * Converts undefined to null and removes empty strings if specified.
 * 
 * @example
 * router.push({
 *   pathname: '/details',
 *   params: sanitizeNavParams({ id, name, optional })
 * });
 */
export function sanitizeNavParams<T extends Record<string, unknown>>(
  params: T
): Record<string, string | number | boolean | null> {
  const result: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      // Skip undefined/null params entirely for navigation
      continue;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      result[key] = value;
    } else {
      // Convert other types to string for navigation safety
      result[key] = String(value);
    }
  }

  return result;
}
