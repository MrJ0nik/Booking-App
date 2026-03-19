import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Room, CreateRoomInput } from "../types";

const COLLECTION = "rooms";

export async function getRooms(): Promise<Room[]> {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),

    users: doc.data().users ?? doc.data().members ?? [],
    createdAt: doc.data().createdAt?.toDate(),
  })) as Room[];
}

export async function createRoom(data: CreateRoomInput): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateRoom(
  id: string,
  data: Partial<CreateRoomInput>,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), data);
}

export async function deleteRoom(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
