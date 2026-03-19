"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { createBooking, isOverlapping } from "@/lib/services/bookings";
import type { Booking } from "@/lib/types";
import type { User } from "firebase/auth";

const schema = z
  .object({
    date: z.string().min(1, "Date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    description: z.string().optional(),
  })
  .refine((d) => d.startTime < d.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

type FormData = z.infer<typeof schema>;

interface Props {
  roomId: string;
  existingBookings: Booking[];
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BookingModal({
  roomId,
  existingBookings,
  currentUser,
  onClose,
  onSuccess,
}: Props) {
  const [error, setError] = useState("");
  const [conflictWith, setConflictWith] = useState<Booking | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: format(new Date(), "yyyy-MM-dd") },
  });

  const watchDate = watch("date");
  const watchStartTime = watch("startTime");
  const watchEndTime = watch("endTime");

  useEffect(() => {
    if (!watchDate || !watchStartTime || !watchEndTime) {
      setConflictWith(null);
      return;
    }
    if (watchStartTime >= watchEndTime) {
      setConflictWith(null);
      return;
    }

    const start = new Date(`${watchDate}T${watchStartTime}`);
    const end = new Date(`${watchDate}T${watchEndTime}`);

    const conflict =
      existingBookings.find((b) => start < b.end && end > b.start) ?? null;

    setConflictWith(conflict);
  }, [watchDate, watchStartTime, watchEndTime, existingBookings]);

  const bookingsOnDate = existingBookings.filter((b) => {
    if (!watchDate) return false;
    return format(b.start, "yyyy-MM-dd") === watchDate;
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError("");
      const start = new Date(`${data.date}T${data.startTime}`);
      const end = new Date(`${data.date}T${data.endTime}`);

      if (isOverlapping(start, end, existingBookings)) {
        setError(
          "This time slot is already booked. Please choose a different time.",
        );
        return;
      }

      await createBooking({
        roomId,
        userId: currentUser.uid,
        userEmail: currentUser.email ?? "",
        start,
        end,
        description: data.description ?? "",
      });

      onSuccess();
    } catch (e: any) {
      setError(e.message ?? "Failed to create booking. Please try again.");
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="font-semibold text-gray-900">New Booking</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              {...register("date")}
              type="date"
              min={format(new Date(), "yyyy-MM-dd")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.date && (
              <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>
            )}
          </div>

          {bookingsOnDate.length > 0 && (
            <div className="px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-medium text-amber-700 mb-1.5">
                Already booked on this day:
              </p>
              <ul className="space-y-1">
                {bookingsOnDate.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center gap-1.5 text-xs text-amber-600"
                  >
                    <Clock className="w-3 h-3" />
                    {format(b.start, "HH:mm")} — {format(b.end, "HH:mm")}
                    <span className="text-amber-400">({b.userEmail})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time *
              </label>
              <input
                {...register("startTime")}
                type="time"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                  conflictWith
                    ? "border-red-300 focus:ring-red-400"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {errors.startTime && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.startTime.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time *
              </label>
              <input
                {...register("endTime")}
                type="time"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                  conflictWith
                    ? "border-red-300 focus:ring-red-400"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {errors.endTime && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.endTime.message}
                </p>
              )}
            </div>
          </div>

          {conflictWith && (
            <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Conflict with existing booking:{" "}
                <strong>
                  {format(conflictWith.start, "HH:mm")} —{" "}
                  {format(conflictWith.end, "HH:mm")}
                </strong>
              </span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register("description")}
              placeholder="What is this booking for?"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!conflictWith}
              className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isSubmitting ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
