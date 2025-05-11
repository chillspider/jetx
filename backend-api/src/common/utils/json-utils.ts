function throwsMessage(err: any): string {
  return `[JSON Throws: ${err?.message ?? '?'}]`;
}

function safeGetValueFromPropertyOnObject(obj: any, property: string): any {
  try {
    if (Object.prototype.hasOwnProperty.call(obj, property)) {
      return obj[property];
    }
    return obj[property];
  } catch (err) {
    return throwsMessage(err);
  }
}

function ensureProperties(obj: any): any {
  const seen = new Set<Record<string, any>>(); // Use a Set for better performance and clarity

  function visit(value: any): any {
    if (value === null || typeof value !== 'object') {
      return value; // Primitive values are returned as-is
    }

    if (seen.has(value)) {
      return '[Circular]'; // Handle circular references
    }

    seen.add(value);

    try {
      // If the object has a toJSON method, use it
      if (typeof value.toJSON === 'function') {
        return visit(value.toJSON());
      }

      if (Array.isArray(value)) {
        // Handle arrays recursively
        return value.map(visit);
      }

      // Handle plain objects
      return Object.keys(value).reduce(
        (result, key) => {
          result[key] = visit(safeGetValueFromPropertyOnObject(value, key));
          return result;
        },
        {} as Record<string, any>,
      );
    } catch (err) {
      return throwsMessage(err);
    } finally {
      seen.delete(value); // Remove the object from the seen set to allow GC
    }
  }

  return visit(obj);
}

export function safeStringify(obj: any, indent: number = 2): string {
  try {
    return JSON.stringify(ensureProperties(obj), null, indent);
  } catch (err) {
    return throwsMessage(err);
  }
}
