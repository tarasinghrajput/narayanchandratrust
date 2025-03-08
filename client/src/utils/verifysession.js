const verifysession = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/auth/verifysession", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      }
    });

    const result = await response.json(); // ✅ Parse JSON once

    if (result.success) {
      console.log("✅ Session Verified:", result);

      if (result.isAdmin) {  // ✅ Fix: Use result.isAdmin directly
        window.location.href = "/admin-dashboard";
      } else {
        window.location.href = "/student-dashboard";
      }
    } else {
      console.error("❌ Session Verification Failed:", result.message);
      localStorage.removeItem("token");
      localStorage.removeItem("student");
    }
  } catch (error) {
    console.error("❌ API Request Failed:", error);
  }
};

export default verifysession;