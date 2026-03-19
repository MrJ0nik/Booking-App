"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import BookingModal from "@/components/bookings/BookingModal";
import BookingList from "@/components/bookings/BookingList";
import { getRooms } from "@/lib/services/rooms";
import { getBookingsByRoom, deleteBooking } from "@/lib/services/bookings";
import type { Room, Booking } from "@/lib/types";

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rooms, bookingData] = await Promise.all([
        getRooms(),
        getBookingsByRoom(roomId),
      ]);
      const found = rooms.find((r) => r.id === roomId) ?? null;
      setRoom(found);
      setBookings(bookingData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [roomId]);

  const handleDeleteBooking = async (id: string) => {
    if (!confirm("Cancel this booking?")) return;
    await deleteBooking(id);
    setBookings((prev) => prev.filter((b) => b.id !== id));
  };

  const isAdmin = room?.adminEmails.includes(user?.email ?? "") ?? false;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {loading ? "Loading..." : (room?.name ?? "Room not found")}
              </h1>
              {room?.description && (
                <p className="text-sm text-gray-500 truncate">
                  {room.description}
                </p>
              )}
            </div>
            {room && (
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:block">Book</span>
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {loading && (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && !room && (
            <div className="text-center py-16 text-gray-400">
              <p>Room not found.</p>
            </div>
          )}

          {!loading && room && (
            <BookingList
              bookings={bookings}
              currentUserEmail={user?.email ?? ""}
              isAdmin={isAdmin}
              onDelete={handleDeleteBooking}
            />
          )}
        </main>
      </div>

      {modalOpen && room && (
        <BookingModal
          roomId={roomId}
          existingBookings={bookings}
          currentUser={user!}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            fetchData();
          }}
        />
      )}
    </ProtectedRoute>
  );
}
