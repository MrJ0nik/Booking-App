import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Booking, CreateBookingInput } from "../types";

const COLLECTION = "bookings";

export async function getBookingsByRoom(roomId: string): Promise<Booking[]> {
  const q = query(
    collection(db, COLLECTION),
    where("roomId", "==", roomId),
    orderBy("start", "asc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    start: doc.data().start?.toDate(),
    end: doc.data().end?.toDate(),
    createdAt: doc.data().createdAt?.toDate(),
  })) as Booking[];
}

export function isOverlapping(
  newStart: Date,
  newEnd: Date,
  existing: Booking[],
  excludeId?: string,
): boolean {
  return existing.some((b) => {
    if (excludeId && b.id === excludeId) return false;
    return newStart < b.end && newEnd > b.start;
  });
}

export async function createBooking(data: CreateBookingInput): Promise<string> {
  const existing = await getBookingsByRoom(data.roomId);
  if (isOverlapping(data.start, data.end, existing)) {
    throw new Error(
      "This time slot is already taken. Please choose another time slot.",
    );
  }

  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    start: data.start,
    end: data.end,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteBooking(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
