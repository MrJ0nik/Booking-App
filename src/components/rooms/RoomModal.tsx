"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X,
  Plus,
  Trash2,
  Shield,
  User as UserIcon,
  ChevronDown,
} from "lucide-react";
import { createRoom, updateRoom } from "@/lib/services/rooms";
import type { Room } from "@/lib/types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface UserEntry {
  email: string;
  role: "admin" | "user";
}

interface Props {
  room: Room | null;
  currentUserEmail: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RoomModal({
  room,
  currentUserEmail,
  onClose,
  onSuccess,
}: Props) {
  const isEdit = !!room;

  const buildInitialUsers = (): UserEntry[] => {
    if (!room) return [];
    return room.users
      .filter((email) => email !== currentUserEmail)
      .map((email) => ({
        email,
        role: room.adminEmails.includes(email) ? "admin" : "user",
      }));
  };

  const [users, setUsers] = useState<UserEntry[]>(buildInitialUsers);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "user">("user");
  const [error, setError] = useState("");

  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: room?.name ?? "",
      description: room?.description ?? "",
    },
  });

  const addUser = () => {
    const email = newEmail.trim().toLowerCase();
    if (
      !email ||
      users.some((u) => u.email === email) ||
      email === currentUserEmail
    )
      return;
    setUsers((prev) => [...prev, { email, role: newRole }]);
    setNewEmail("");
    setNewRole("user");
  };

  const toggleRole = (email: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.email === email
          ? { ...u, role: u.role === "admin" ? "user" : "admin" }
          : u,
      ),
    );
  };

  const onSubmit = async (data: FormData) => {
    try {
      setError("");
      const creatorEntry: UserEntry = {
        email: currentUserEmail,
        role: "admin",
      };
      const allUsers = [creatorEntry, ...users];
      const adminEmails = allUsers
        .filter((u) => u.role === "admin")
        .map((u) => u.email);
      const userEmails = allUsers.map((u) => u.email);

      if (isEdit) {
        await updateRoom(room.id, {
          name: data.name,
          description: data.description ?? "",
          adminEmails,
          users: userEmails,
        });
      } else {
        await createRoom({
          name: data.name,
          description: data.description ?? "",
          adminEmails,
          users: userEmails,
        });
      }
      onSuccess();
    } catch {
      setError("Failed to save. Please try again");
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsRoleMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full bg-white rounded-t-2xl sm:rounded-xl shadow-xl sm:max-w-md sm:mx-4 max-h-[92vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">
            {isEdit ? "Edit Room" : "New Room"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="px-4 sm:px-6 py-4 sm:py-5 space-y-4"
        >
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              {...register("name")}
              placeholder="Conference Room A"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register("description")}
              placeholder="Room description..."
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Users
            </label>

            <div className="flex items-center justify-between px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-lg mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="text-sm text-gray-700 truncate">
                  {currentUserEmail}
                </span>
                <span className="text-xs text-gray-400 shrink-0">(you)</span>
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full shrink-0 ml-2">
                Admin
              </span>
            </div>

            {users.length > 0 && (
              <ul className="space-y-1.5 mb-3 max-h-36 overflow-y-auto">
                {users.map((user) => (
                  <li
                    key={user.email}
                    className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {user.role === "admin" ? (
                        <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      ) : (
                        <UserIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      )}
                      <span className="text-sm text-gray-700 truncate">
                        {user.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleRole(user.email)}
                        className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                          user.role === "admin"
                            ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                      >
                        {user.role === "admin" ? "Admin" : "User"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setUsers((p) =>
                            p.filter((m) => m.email !== user.email),
                          )
                        }
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addUser();
                  }
                }}
                placeholder="email@example.com"
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex gap-2">
                <div className="relative flex-1 sm:flex-none" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                    className="w-full min-w-[100px] flex items-center justify-between px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  >
                    <span className="capitalize">{newRole}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${isRoleMenuOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isRoleMenuOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => {
                          setNewRole("user");
                          setIsRoleMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${newRole === "user" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
                      >
                        User
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewRole("admin");
                          setIsRoleMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${newRole === "admin" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
                      >
                        Admin
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={addUser}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isSubmitting
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Create Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
