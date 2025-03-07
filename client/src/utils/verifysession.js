const verifysession = async () => {
  let response = await fetch("http://localhost:3000/api/auth/verifysession", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ token: localStorage.getItem("token") })
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log("✅ Session Verified:", data);
      } else {
        console.error("❌ Session Verification Failed:", data.message);
      }
    })
    .catch(error => console.error("❌ API Request Failed:", error));

  let result = await response.json();
  if (result.success) {
    if (result.data.isAdmin) {
      window.location.href = "/admin-dashboard";
    } else {
      window.location.href = "/student-dashboard";
    }
  }
  else {
    localStorage.removeItem("token");
    localStorage.removeItem("student");
  }
};

export default verifysession;