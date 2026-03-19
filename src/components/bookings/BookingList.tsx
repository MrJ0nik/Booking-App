"use client";

import { format } from "date-fns";
import { Calendar, Clock, Trash2, User } from "lucide-react";
import type { Booking } from "@/lib/types";

interface Props {
  bookings: Booking[];
  currentUserEmail: string;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}

export default function BookingList({
  bookings,
  currentUserEmail,
  isAdmin,
  onDelete,
}: Props) {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No bookings yet. Be the first to book!</p>
      </div>
    );
  }

  const grouped = bookings.reduce<Record<string, Booking[]>>((acc, booking) => {
    const dateKey = format(booking.start, "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(booking);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([dateKey, dayBookings]) => (
        <div key={dateKey}>
          {/* Date header */}
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {format(new Date(dateKey + "T00:00:00"), "EEEE, MMMM d, yyyy")}
          </h3>

          <div className="space-y-2">
            {dayBookings.map((booking) => {
              const canDelete =
                isAdmin || booking.userEmail === currentUserEmail;
              const isOwner = booking.userEmail === currentUserEmail;

              return (
                <div
                  key={booking.id}
                  className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-start justify-between gap-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    {/* Time */}
                    <div className="flex items-center gap-1.5 text-blue-600 font-medium text-sm mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      {format(booking.start, "HH:mm")} —{" "}
                      {format(booking.end, "HH:mm")}
                    </div>

                    {booking.description && (
                      <p className="text-sm text-gray-700 mb-2">
                        {booking.description}
                      </p>
                    )}

                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <User className="w-3 h-3" />
                      <span>{isOwner ? "You" : booking.userEmail}</span>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      onClick={() => onDelete(booking.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors shrink-0"
                      aria-label="Cancel booking"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
