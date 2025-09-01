import * as logger from "firebase-functions/logger";
import { onCall } from "firebase-functions/v2/https";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

function ymd(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth()+1}`.padStart(2,'0');
  const d = `${date.getDate()}`.padStart(2,'0');
  return `${y}-${m}-${d}`;
}

/**
 * bookSlot — transactional booking with **per-slot** trainee daily cap.
 * Expects: { slotPath: "schedules/{supervisorEmail}/slots/{slotId}" }
 * Uses: slot.dailyCapForTrainee || 2
 */
export const bookSlot = onCall({ enforceAppCheck: true }, async (req) => {
  const { slotPath } = req.data as { slotPath: string };
  const traineeEmail = req.auth?.token?.email as string | undefined;
  if (!traineeEmail) throw new Error("Unauthenticated");

  const db = getFirestore();
  const slotRef = db.doc(slotPath);
  const bookingRef = db.collection("bookings").doc();

  await db.runTransaction(async (tx) => {
    const slotSnap = await tx.get(slotRef);
    if (!slotSnap.exists) throw new Error("Slot not found");
    const slot = slotSnap.data()!;
    if (slot.status !== "available") throw new Error("Slot not available");

    const cap = Number(slot.dailyCapForTrainee ?? 2);
    const start = (slot.start as Timestamp).toDate();
    const dayKey = ymd(start);

    const sameDayBookings = await tx.get(
      db.collection("bookings")
        .where("traineeId", "==", traineeEmail)
        .where("status", "==", "booked")
        .where("slotDateKey", "==", dayKey)
    );
    if (sameDayBookings.size >= cap) throw new Error(`Daily booking limit reached (${cap}).`);

    tx.update(slotRef, {
      status: "booked",
      traineeId: traineeEmail,
      bookingId: bookingRef.id,
      updatedAt: FieldValue.serverTimestamp(),
    });

    tx.set(bookingRef, {
      slotRef: slotRef.path,
      supervisorId: slot.supervisorId,
      traineeId: traineeEmail,
      status: "booked",
      slotDateKey: dayKey,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  logger.info(`Booked ${slotPath} for ${traineeEmail}`);
  return { ok: true };
});
