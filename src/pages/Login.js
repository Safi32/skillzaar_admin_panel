import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithEmailPassword } from "../utils/firebaseAuth";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    const result = await loginWithEmailPassword(email, password);
    if (result.success) {
      navigate("/", { replace: true });
    } else {
      setError(result.error || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #e0f7fa, #e8f5e9)" }}>
      <div style={{ width: "100%", maxWidth: 420, background: "white", borderRadius: 16, boxShadow: "0 10px 40px rgba(0,0,0,0.12)", padding: 28, border: "1px solid #e8f5e8" }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 34 }}>🛠️</div>
          <h2 style={{ margin: 8, color: "#1f2937" }}>Skillzaar Admin</h2>
          <p style={{ color: "#6b7280", fontSize: 14 }}>Sign in to continue</p>
        </div>
        
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 12 }}>{error}</div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "#374151", marginBottom: 6 }}>Email</label>
              <input 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                type="email" 
                placeholder="Enter your email" 
                required
                style={{ width: "100%", padding: 12, borderRadius: 10, border: "2px solid #e5e7eb", fontSize: 14 }} 
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "#374151", marginBottom: 6 }}>Password</label>
              <input 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                type="password" 
                placeholder="Enter your password" 
                required
                style={{ width: "100%", padding: 12, borderRadius: 10, border: "2px solid #e5e7eb", fontSize: 14 }} 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                marginTop: 6, 
                background: loading ? "#9ca3af" : "linear-gradient(135deg, #22c55e, #16a34a)", 
                color: "white", 
                border: "none", 
                padding: "12px 16px", 
                borderRadius: 10, 
                fontWeight: 600, 
                cursor: loading ? "not-allowed" : "pointer", 
                boxShadow: "0 6px 16px rgba(34,197,94,0.3)" 
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
