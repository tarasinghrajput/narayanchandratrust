import { useState } from "react";
import { Input } from "./Input";
import { Button } from "../Common/PrimaryButton";
import { Loader } from "../Common/Loader";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function RegisterStudent() {
  const registerStudent = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      let student = {
        name: name,
        cms_id: cms,
        room_no: room_no,
        batch: batch,
        dept: dept,
        course: course,
        email: email,
        father_name: fatherName,
        contact: contact.trim(),
        address: address,
        dob: dob,
        cnic: cnic.trim(),
        hostel: hostel,
        password: password
      };
      const res = await fetch("http://localhost:3000/api/student/register-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(student),
      })
      const data = await res.json();
















      if (data.success) {
        toast.success(
          'Student ' + data.student.name + ' Registered Successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        })
        setCms("");
        setName("");
        setRoomNo("");
        setBatch("");
        setDept("");
        setCourse("");
        setEmail("");
        setFatherName("");
        setContact("");
        setAddress("");
        setDob("");
        setCnic("");
        setPassword("");
        setLoading(false);
      } else {
        // console.log(cms);
        data.errors.forEach((err) => {
          toast.error(
            err.msg || "Unknown error occurred.", {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
          })
        })
        setLoading(false);

      }
    } catch (err) {
      toast.error(
        err, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      }
      )
      setLoading(false);
    }
  };



  // Validation
  const validateCms = (value) => {
    if (!/^\d{6}$/.test(value)) {
      setErrors((prev) => ({ ...prev, cms: "CMS ID must be exactly 6 digits." }));
    } else {
      setErrors((prev) => ({ ...prev, cms: "" }));
    }
    setCms(value);
  };

  const validateName = (value) => {
    if (!/^[A-Za-z ]+$/.test(value)) {
      setErrors((prev) => ({ ...prev, name: "Only alphabets are allowed." }));
    } else {
      setErrors((prev) => ({ ...prev, name: "" }));
    }
    setName(value);
  };

  const validateRoomNo = (value) => {
    const num = parseInt(value, 10);
    if (!/^\d+$/.test(value) || num < 1 || num > 35) {
      setErrors((prev) => ({ ...prev, room_no: "Room number must be between 1 and 35." }));
    } else {
      setErrors((prev) => ({ ...prev, room_no: "" }));
    }
    setRoomNo(value);
  };

  const validateBatch = (value) => {
    if (!/^\d{4}$/.test(value)) {
      setErrors((prev) => ({ ...prev, batch: "Batch must be a 4-digit year (e.g., 2024)." }));
    } else {
      setErrors((prev) => ({ ...prev, batch: "" }));
    }
    setBatch(value);
  };

  const validateDept = (value) => {
    if (!/^[A-Za-z ]+$/.test(value)) {
      setErrors((prev) => ({ ...prev, dept: "Only alphabets are allowed." }));
    } else {
      setErrors((prev) => ({ ...prev, dept: "" }));
    }
    setDept(value);
  };

  const validateCourse = (value) => {
    if (!/^[A-Za-z ]+$/.test(value)) {
      setErrors((prev) => ({ ...prev, course: "Only alphabets are allowed." }));
    } else {
      setErrors((prev) => ({ ...prev, course: "" }));
    }
    setCourse(value);
  };

  const validateEmail = (value) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setErrors((prev) => ({ ...prev, email: "Invalid email format." }));
    } else {
      setErrors((prev) => ({ ...prev, email: "" }));
    }
    setEmail(value);
  };

  const validateFatherName = (value) => {
    if (!/^[A-Za-z ]+$/.test(value)) {
      setErrors((prev) => ({ ...prev, fatherName: "Only alphabets are allowed." }));
    } else {
      setErrors((prev) => ({ ...prev, fatherName: "" }));
    }
    setFatherName(value);
  };

  const validateContact = (value) => {
    if (!/^\d{10}$/.test(value)) { // ✅ This should allow only 10-digit numbers
      setErrors((prev) => ({ ...prev, contact: "Contact must be exactly 10 digits." }));
    } else {
      setErrors((prev) => ({ ...prev, contact: "" }));
    }
    setContact(value);
  };

  const validateAddress = (value) => {
    if (!/^[A-Za-z0-9,.\s]+$/.test(value)) {
      setErrors((prev) => ({ ...prev, address: "Address can only contain letters, numbers, and commas." }));
    } else {
      setErrors((prev) => ({ ...prev, address: "" }));
    }
    setAddress(value);
  };

  const validateDob = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      setErrors((prev) => ({ ...prev, dob: "Invalid date format (YYYY-MM-DD)." }));
    } else {
      setErrors((prev) => ({ ...prev, dob: "" }));
    }
    setDob(value);
  };

  const validateCnic = (value) => {
    if (!/^\d{12}$/.test(value)) { // ✅ This should allow only 12-digit numbers
      setErrors((prev) => ({ ...prev, cnic: "CNIC must be exactly 12 digits." }));
    } else {
      setErrors((prev) => ({ ...prev, cnic: "" }));
    }
    setCnic(value);
  };

  const validatePassword = (value) => {
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(value)) {
      setErrors((prev) => ({ ...prev, password: "Password must be at least 8 characters, with letters and numbers." }));
    } else {
      setErrors((prev) => ({ ...prev, password: "" }));
    }
    setPassword(value);
  };




  const hostel = JSON.parse(localStorage.getItem("hostel")).name;
  const [cms, setCms] = useState("");
  const [name, setName] = useState("");
  const [room_no, setRoomNo] = useState("");
  const [batch, setBatch] = useState("");
  const [dept, setDept] = useState("");
  const [course, setCourse] = useState("");
  const [email, setEmail] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [dob, setDob] = useState("");
  const [cnic, setCnic] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({
    cms: "",
    name: "",
    room_no: "",
    batch: "",
    dept: "",
    course: "",
    email: "",
    fatherName: "",
    contact: "",
    address: "",
    dob: "",
    cnic: "",
    password: ""
  })
  const [loading, setLoading] = useState(false);

  return (
    <div className="w-full max-h-screen pt-20 flex flex-col items-center justify-center">
      <h1 className="text-white font-bold text-5xl mt-10 mb-5">
        Register Student
      </h1>
      <div className="md:w-[60vw] w-full p-10 bg-neutral-950 rounded-lg shadow-xl mb-10 overflow-auto">
        <form method="post" onSubmit={registerStudent} className="flex flex-col gap-3">
          <div className="flex gap-5 flex-wrap justify-center md:w-full sw-[100vw]">
            <div className="flex flex-col">
              <Input field={{ name: "name", placeholder: "Student Name", type: "text", req: true, value: name, onChange: (e) => validateName(e.target.value) }} />
              {errors.name && <p style={{ color: "red", fontSize: "10px" }}>{errors.name}</p>}
            </div>

            <div className="flex flex-col">
              <Input
                field={{
                  name: "cms",
                  placeholder: "Student CMS",
                  type: "number",
                  req: true,
                  value: cms,
                  onChange: (e) => validateCms(e.target.value),
                }}
              />
              {errors.cms && <p style={{ color: "red", fontSize: "10px" }}>{errors.cms}</p>}
            </div>

            <div className="flex flex-col">
              <Input
                field={{
                  name: "dob",
                  placeholder: "Student dob",
                  type: "date",
                  req: true,
                  value: dob,
                  onChange: (e) => validateDob(e.target.value),
                }}
              />
              {errors.dob && <p style={{ color: "red", fontSize: "10px" }}>{errors.dob}</p>}
            </div>

            <div className="flex flex-col">
              <Input
                field={{
                  name: "cnic",
                  placeholder: "Student Aadhar Card Number",
                  type: "text",
                  req: true,
                  value: cnic,
                  onChange: (e) => validateCnic(e.target.value),
                }}
              />
              {errors.cnic && <p style={{ color: "red", fontSize: "10px" }}>{errors.cnic}</p>}
            </div>
          </div>
          <div className="flex gap-5 w-full flex-wrap justify-center">
            <div className="flex flex-col">
              <Input
                field={{
                  name: "email",
                  placeholder: "Student Email",
                  type: "email",
                  req: true,
                  value: email,
                  onChange: (e) => validateEmail(e.target.value),
                }}
              />
              {errors.email && <p style={{ color: "red", fontSize: "10px" }}>{errors.email}</p>}
            </div>

            <div className="flex flex-col">
              <Input
                field={{
                  name: "contact",
                  placeholder: "Student Contact",
                  type: "text",
                  req: true,
                  value: contact,
                  onChange: (e) => validateContact(e.target.value),
                }}
              />
              {errors.contact && <p style={{ color: "red", fontSize: "10px" }}>{errors.contact}</p>}
            </div>

            <div className="flex flex-col">
              <Input
                field={{
                  name: "father_name",
                  placeholder: "Student's Father Name",
                  type: "text",
                  req: true,
                  value: fatherName,
                  onChange: (e) => validateFatherName(e.target.value),
                }}
              />
              {errors.fatherName && <p style={{ color: "red", fontSize: "10px" }}>{errors.fatherName}</p>}
            </div>
          </div>
          <div className="mx-12">
            <label
              htmlFor="address"
              className="block mb-2 text-sm font-medium text-white"
            >
              Address
            </label>
            <div className="flex flex-col">
              <textarea
                name="address"
                placeholder="Student Address"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="border flex-grow sm:text-sm rounded-lg block w-full p-2.5 bg-neutral-700 border-neutral-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              {errors.address && <p style={{ color: "red", fontSize: "10px" }}>{errors.address}</p>}
            </div>
          </div>
          <div className="flex flex-wrap gap-5 w-full justify-center">
            <div className="flex flex-col">
              <Input
                field={{
                  name: "room",
                  placeholder: "Student Room",
                  type: "number",
                  req: true,
                  value: room_no,
                  onChange: (e) => validateRoomNo(e.target.value),
                }}
              />
              {errors.room_no && <p style={{ color: "red", fontSize: "10px" }}>{errors.room_no}</p>}
            </div>

            <div className="flex flex-col">
              <Input
                field={{
                  name: "hostel",
                  placeholder: "Student Hostel",
                  type: "text",
                  req: true,
                  value: hostel,
                  disabled: true,
                }}
              />
            </div>

            <div className="flex flex-col">
              <Input
                field={{
                  name: "dept",
                  placeholder: "Student Department",
                  type: "text",
                  req: true,
                  value: dept,
                  onChange: (e) => validateDept(e.target.value),
                }}
              />
              {errors.dept && <p style={{ color: "red", fontSize: "10px" }}>{errors.dept}</p>}
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-5">
            <div className="flex flex-col">
              <Input
                field={{
                  name: "course",
                  placeholder: "Student Course",
                  type: "text",
                  req: true,
                  value: course,
                  onChange: (e) => validateCourse(e.target.value),
                }}
              />
              {errors.course && <p style={{ color: "red", fontSize: "10px" }}>{errors.course}</p>}
            </div>

            <div className="flex flex-col">
              <Input
                field={{
                  name: "batch",
                  placeholder: "Student Batch",
                  type: "number",
                  req: true,
                  value: batch,
                  onChange: (e) => validateBatch(e.target.value),
                }}
              />
              {errors.batch && <p style={{ color: "red", fontSize: "10px" }}>{errors.batch}</p>}
            </div>
          </div>
          <div className="mx-12">
            <div className="flex flex-col">
              <Input
                field={{
                  name: "password",
                  placeholder: "Student Password",
                  type: "password",
                  req: true,
                  value: password,
                  onChange: (e) => validatePassword(e.target.value),
                }}
              />
              {errors.password && <p style={{ color: "red", fontSize: "10px" }}>{errors.password}</p>}
            </div>
          </div>
          <div className="mt-5">
            <Button>
              {loading ? (
                <>
                  <Loader /> Registering...
                </>
              ) : (
                <span>Register Student</span>
              )}
            </Button>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
            />
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterStudent;
