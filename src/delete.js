import React, { useState } from "react";
import { getAuth, deleteUser } from "firebase/auth";

export default function DeleteAccount() {
    const [identifier, setIdentifier] = useState(""); // email or phone

    const handleDelete = async () => {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            alert("No user is currently signed in.");
            return;
        }

        try {
            // Directly delete account, ignore identifier checks
            await deleteUser(user);
            alert("Your account has been deleted successfully.");
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Error: " + error.message);
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>Delete Account</h2>

            <input
                type="text"
                placeholder="Enter Email or Phone (optional)"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={{
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    marginBottom: "10px",
                    width: "100%",
                    fontSize: "16px",
                }}
            />

            <button
                onClick={handleDelete}
                style={{
                    backgroundColor: "red",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "16px",
                }}
            >
                Delete My Account
            </button>
        </div>
    );
}
