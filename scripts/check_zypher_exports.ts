/**
 * Scripts: check_zypher_exports.ts
 * Helper to quickly list top-level exports from @corespeed/zypher.
 * Usage: deno run --config deno.json -A scripts/check_zypher_exports.ts
 */
import * as mod from "@corespeed/zypher";
console.log("@corespeed/zypher exports:", Object.keys(mod).sort());

// Print a compact JSON of exports for quick inspection
const simple = Object.fromEntries(Object.keys(mod).map(k => [k, typeof (mod as any)[k]]));
console.log(JSON.stringify(simple, null, 2));
