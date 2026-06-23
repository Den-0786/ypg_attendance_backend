import React from "react";

export default function AdminCredentialsModal({
  showAdminModal,
  adminUsername,
  setAdminUsername,
  adminPassword,
  setAdminPassword,
  pendingUndoApology,
  setPendingUndoApology,
  pendingEditApology,
  setPendingEditApology,
  API_URL,
  refetchApologyData,
  setShowAdminModal
}) {
  return (
    <>
      {showAdminModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-xs">
            <h3 className="font-bold mb-2 text-center">
              Admin Credentials Required
            </h3>
            <input
              type="text"
              className="w-full mb-2 p-2 rounded border"
              placeholder="Admin Username"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
            />
            <input
              type="password"
              className="w-full mb-4 p-2 rounded border"
              placeholder="Admin Password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                className="bg-blue-600 text-white px-4 py-1 rounded"
                onClick={async () => {
                  if (pendingUndoApology) {
                    const res = await fetch(`${API_URL}/api/submit-apologies`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({
                        apologies: [pendingUndoApology],
                        admin_username: adminUsername,
                        admin_password: adminPassword,
                      }),
                    });
                    if (res.ok) {
                      setShowAdminModal(false);
                      setPendingUndoApology(null);
                      setAdminUsername("");
                      setAdminPassword("");
                      if (refetchApologyData) refetchApologyData();
                      window.dispatchEvent(new CustomEvent("apologyDataChanged"));
                      toast.success("Apology restored!");
                    } else {
                      toast.error("Failed to restore apology");
                    }
                  } else if (pendingEditApology) {
                    const res = await fetch(
                      `${API_URL}/api/edit-apology/${pendingEditApology.id}`,
                      {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({
                          ...pendingEditApology,
                          pin: pendingEditApology.pin,
                        }),
                      }
                    );
                    if (res.ok) {
                      setShowAdminModal(false);
                      setPendingEditApology(null);
                      setAdminUsername("");
                      setAdminPassword("");
                      if (refetchApologyData) refetchApologyData();
                      window.dispatchEvent(new CustomEvent("apologyDataChanged"));
                      toast.success("Apology updated!");
                    } else {
                      toast.error("Failed to update apology");
                    }
                  }
                }}
              >
                Submit
              </button>
              <button
                className="bg-gray-400 text-white px-4 py-1 rounded"
                onClick={() => {
                  setShowAdminModal(false);
                  setPendingUndoApology(null);
                  setPendingEditApology(null);
                  setAdminUsername("");
                  setAdminPassword("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
