"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, LogOut, Building2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoomCard from "@/components/rooms/RoomCard";
import RoomModal from "@/components/rooms/RoomModal";
import { getRooms, deleteRoom } from "@/lib/services/rooms";
import type { Room } from "@/lib/types";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await getRooms();
      setRooms(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete room?")) return;
    await deleteRoom(id);
    setRooms((prev) => prev.filter((r) => r.id !== id));
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingRoom(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    fetchRooms();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-500" />
              <h1 className="text-lg font-semibold text-gray-900">
                Booking App
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm text-gray-500">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">sign out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Rooms</h2>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add new room
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Empty */}
          {!loading && rooms.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No rooms yet. Add the first one!</p>
            </div>
          )}

          {/* Rooms grid */}
          {!loading && rooms.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  currentUserEmail={user?.email ?? ""}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onClick={() => router.push(`/dashboard/${room.id}`)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal створення/редагування */}
      {modalOpen && (
        <RoomModal
          room={editingRoom}
          currentUserEmail={user?.email ?? ""}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </ProtectedRoute>
  );
}
