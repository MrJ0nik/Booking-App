export type Room = {
  id: string;
  name: string;
  description: string;
  adminEmails: string[];
  users: string[];
  createdAt: Date;
};

export type Booking = {
  id: string;
  roomId: string;
  userId: string;
  userEmail: string;
  start: Date;
  end: Date;
  description: string;
  createdAt: Date;
};

export type CreateRoomInput = Omit<Room, "id" | "createdAt">;
export type CreateBookingInput = Omit<Booking, "id" | "createdAt">;
