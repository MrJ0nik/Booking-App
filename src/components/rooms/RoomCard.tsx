"use client";

import { Pencil, Trash2, Users, ChevronRight } from "lucide-react";
import type { Room } from "@/lib/types";

interface Props {
  room: Room;
  currentUserEmail: string;
  onEdit: (room: Room) => void;
  onDelete: (id: string) => void;
  onClick: () => void;
}

export default function RoomCard({
  room,
  currentUserEmail,
  onEdit,
  onDelete,
  onClick,
}: Props) {
  const isAdmin = room.adminEmails.includes(currentUserEmail);

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
          {room.name}
        </h3>
        {isAdmin && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(room);
              }}
              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(room.id);
              }}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {room.description && (
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
          {room.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Users className="w-3.5 h-3.5" />

          <span>{room.users?.length ?? 0} members</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
      </div>
    </div>
  );
}
