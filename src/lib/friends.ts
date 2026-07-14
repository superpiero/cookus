import "server-only";
import { db } from "./db";

/** Id všech přátel (ACCEPTED, oba směry). */
export async function getFriendIds(userId: string): Promise<string[]> {
  const rows = await db.friendship.findMany({
    where: { status: "ACCEPTED", OR: [{ requesterId: userId }, { addresseeId: userId }] },
    select: { requesterId: true, addresseeId: true },
  });
  return rows.map((row) => (row.requesterId === userId ? row.addresseeId : row.requesterId));
}

export type FriendshipState =
  | { state: "none" }
  | { state: "outgoing"; friendshipId: string }
  | { state: "incoming"; friendshipId: string }
  | { state: "friends"; friendshipId: string };

/** Stav přátelství mezi dvěma účty (pro tlačítko na profilu). */
export async function getFriendshipState(meId: string, otherId: string): Promise<FriendshipState> {
  const row = await db.friendship.findFirst({
    where: {
      OR: [
        { requesterId: meId, addresseeId: otherId },
        { requesterId: otherId, addresseeId: meId },
      ],
    },
    select: { id: true, status: true, requesterId: true },
  });
  if (!row) return { state: "none" };
  if (row.status === "ACCEPTED") return { state: "friends", friendshipId: row.id };
  return row.requesterId === meId
    ? { state: "outgoing", friendshipId: row.id }
    : { state: "incoming", friendshipId: row.id };
}
