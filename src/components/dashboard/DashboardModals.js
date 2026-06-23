import React from "react";
import AttendanceForm from "../forms/AttendanceForm";
import ApologyForm from "../forms/ApologyForm";
import PINModal from "../auth/PINModal";

export default function DashboardModals({
  editModal,
  setEditModal,
  handleSaveEdit,
  capitalizeWords,
  showAttendanceForm,
  setShowAttendanceForm,
  showApologyForm,
  setShowApologyForm,
  showPINModal,
  setShowPINModal,
  pendingAction,
  setPendingAction,
  pendingEntry,
  setPendingEntry,
  handlePINSuccess,
  darkMode
}) {
  return (
    <>
      {/* Edit Modal */}
      {editModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-blue-700">Edit Entry</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEdit(editModal.entry);
              }}
              className="space-y-3"
            >
              <label className="block text-sm font-medium">
                Name
                <input
                  className="w-full mt-1 p-2 border rounded"
                  value={editModal.entry.name}
                  onChange={(e) =>
                    setEditModal((m) => ({
                      ...m,
                      entry: {
                        ...m.entry,
                        name: capitalizeWords(e.target.value),
                      },
                    }))
                  }
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                Phone
                <input
                  className="w-full mt-1 p-2 border rounded"
                  value={editModal.entry.phone}
                  onChange={(e) =>
                    setEditModal((m) => ({
                      ...m,
                      entry: {
                        ...m.entry,
                        phone: capitalizeWords(e.target.value),
                      },
                    }))
                  }
                />
              </label>
              <label className="block text-sm font-medium">
                Congregation
                <input
                  className="w-full mt-1 p-2 border rounded"
                  value={editModal.entry.congregation}
                  onChange={(e) =>
                    setEditModal((m) => ({
                      ...m,
                      entry: {
                        ...m.entry,
                        congregation: capitalizeWords(e.target.value),
                      },
                    }))
                  }
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                Position
                <input
                  className="w-full mt-1 p-2 border rounded"
                  value={editModal.entry.position}
                  onChange={(e) =>
                    setEditModal((m) => ({
                      ...m,
                      entry: {
                        ...m.entry,
                        position: capitalizeWords(e.target.value),
                      },
                    }))
                  }
                  required
                />
              </label>
              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  className="bg-gray-400 text-white px-4 py-1 rounded hover:bg-gray-500"
                  onClick={() => setEditModal({ open: false, entry: null })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Form Modal */}
      {showAttendanceForm && (
        <AttendanceForm
          onClose={() => setShowAttendanceForm(false)}
          darkMode={darkMode}
        />
      )}

      {/* Apology Form Modal */}
      {showApologyForm && (
        <ApologyForm
          onClose={() => setShowApologyForm(false)}
          darkMode={darkMode}
        />
      )}

      {/* PIN Modal */}
      <PINModal
        isOpen={showPINModal}
        onClose={() => {
          setShowPINModal(false);
          setPendingAction(null);
          setPendingEntry(null);
        }}
        onSuccess={handlePINSuccess}
        title={
          pendingAction === "edit"
            ? "Enter PIN to Edit"
            : pendingAction === "delete"
              ? "Enter PIN to Delete"
              : "Enter PIN to Clear All Data"
        }
        message={
          pendingAction === "edit"
            ? "Please enter the 4-digit PIN to edit this record"
            : pendingAction === "delete"
              ? "Please enter the 4-digit PIN to delete this record"
              : "Please enter the 4-digit PIN to clear all data"
        }
      />
    </>
  );
}
