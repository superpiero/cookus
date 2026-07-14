/** Kanonické pořadí dvojice účastníků — unikátnost konverzace hlídá DB (docs/02 §2). */
export function canonicalPair(a: string, b: string): { userAId: string; userBId: string } {
  return a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a };
}
