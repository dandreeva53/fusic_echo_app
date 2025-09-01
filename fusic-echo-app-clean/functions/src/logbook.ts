import * as crypto from "crypto";
import { onCall } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

/**
 * signLogbookEntry — add mentor/supervisor signature & optionally lock.
 * Expects: { entryId, role: "mentor"|"supervisor", sigUrl?, signerName? }
 * Locks the entry when role === "supervisor".
 */
export const signLogbookEntry = onCall({ enforceAppCheck: true }, async (req) => {
  const { entryId, role, sigUrl, signerName } = req.data as {
    entryId: string; role: "mentor" | "supervisor"; sigUrl?: string; signerName?: string;
  };
  const signerEmail = req.auth?.token?.email as string | undefined;
  if (!signerEmail) throw new Error("Unauthenticated");
  if (role !== "mentor" && role !== "supervisor") throw new Error("Invalid role");

  const db = getFirestore();
  const ref = db.collection("logbookEntries").doc(entryId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("Entry not found");
    const data = snap.data()!;

    const core = {
      ownerUid: data.ownerUid,
      date: data.date?.toMillis?.() ?? data.date,
      indication: data.indication,
      views: data.views,
      findings: data.findings,
      summary: data.summary,
      directlyObserved: data.directlyObserved,
      imageQuality: data.imageQuality,
      demographics: data.demographics,
      notes: data.notes,
      diagnosis: data.diagnosis,
      comments: data.comments
    };
    const digest = crypto.createHash("sha256")
      .update(JSON.stringify(core) + `|${signerEmail}|${role}`)
      .digest("hex");

    const field = role === "mentor" ? "mentorSignature" : "supervisorSignature";
    const update: any = {
      [field]: { uid: signerEmail, name: signerName || "", at: FieldValue.serverTimestamp(), sigUrl: sigUrl || null, hash: digest },
      updatedAt: FieldValue.serverTimestamp()
    };
    if (role === "supervisor") update.locked = true;
    tx.update(ref, update);
  });

  return { ok: true };
});
