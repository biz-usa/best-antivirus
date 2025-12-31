
import type { Timestamp as AdminTs } from 'firebase-admin/firestore'
import type { Timestamp as WebTs } from 'firebase/firestore'

function isTimestamp(v: any): v is AdminTs | WebTs {
  return !!v && typeof v === 'object' &&
         (typeof (v as any).toMillis === 'function' || typeof (v as any).toDate === 'function');
}

function isPlainObject(v: any) {
  if (v === null || typeof v !== 'object') return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

export function serializeForClient<T>(input: T): any {
  if (input == null) return input;

  const t = typeof input;
  if (t === 'string' || t === 'number' || t === 'boolean') return input;
  
  if (isTimestamp(input)) {
    try { 
      // Firestore Timestamps have a toDate() method
      if (typeof (input as WebTs).toDate === 'function') {
        return (input as WebTs).toDate().toISOString();
      }
    } catch { 
      // Fallback for any other timestamp-like objects
      return String(input); 
    }
  }
  
  if (input instanceof Date) return input.toISOString();


  if (Array.isArray(input)) return input.map(serializeForClient);

  if (isPlainObject(input)) {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(input as any)) {
      const sv = serializeForClient(v);
      if (sv !== undefined) out[k] = sv;
    }
    return out;
  }

  // For other complex objects that are not plain objects, try to stringify
  try { return JSON.parse(JSON.stringify(input)); } catch { return String(input); }
}
