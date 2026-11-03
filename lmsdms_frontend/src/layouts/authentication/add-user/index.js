import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import BasicLayout from "layouts/authentication/components/BasicLayout";
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import { FormControl, InputLabel, Select, MenuItem, OutlinedInput, Switch,FormControlLabel } from "@mui/material";
import { useCreateUserMutation } from "api/auth/userApi";
import { useFetchDepartmentsQuery } from "api/auth/departmentApi";
import { getUserGroups } from "api/auth/auth";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ESignatureDialog from "layouts/authentication/ESignatureDialog";

function AddUser() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [userRole, setUserRole] = useState([]);
  const [department, setDepartment] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState(""); // ✅ new field
  const [designation, setDesignation] = useState(""); // ✅ new field
  const [isDmsUser, setIsDmsUser] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRoles, setUserRoles] = useState([]);
  const [errors, setErrors] = useState({});
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);

  const navigate = useNavigate();
  const [createUser, { isLoading }] = useCreateUserMutation();

  const { data: departmentsData, isLoading: isDepartmentsLoading } = useFetchDepartmentsQuery();

  useEffect(() => {
    const fetchUserRoles = async () => {
      try {
        const response = await getUserGroups();
        setUserRoles(response?.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch user roles:", error);
      }
    };
    fetchUserRoles();
  }, []);

  const validateInputs = () => {
    const newErrors = {};
    if (!firstName.trim()) newErrors.firstName = "First Name is required.";
    if (!lastName.trim()) newErrors.lastName = "Last Name is required.";
    if (!email.trim()) newErrors.email = "Email is required.";
    if (!employeeNumber.trim()) newErrors.employeeNumber = "Employee Number is required."; // ✅
    if (!designation.trim()) newErrors.designation = "Designation is required."; // ✅
    // if (!phone.trim()) newErrors.phone = "Phone is required.";
    if (!username.trim()) newErrors.username = "Username is required.";
    if (!userRole.length) newErrors.userRole = "User Role is required.";
    if (!department) newErrors.department = "Department is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!validateInputs()) {
      toast.error("Please fill all required fields.");
      setIsSubmitting(false);
      return;
    }
    setOpenSignatureDialog(true); // Open E-Signature dialog
  };

  const handleSignatureComplete = async (password) => {
    setOpenSignatureDialog(false);
    if (!password) {
      toast.error("E-Signature is required to proceed.");
      setIsSubmitting(false);
      return;
    }

    const userData = {
      first_name: firstName,
      last_name: lastName,
      email,
      employee_number: employeeNumber, // ✅ added
      designation, // ✅ added
      // phone,
      username,
      is_dms: isDmsUser,
      user_role: userRole,
      department_id: department,
    };

    try {
      const response = await createUser(userData).unwrap();

  if (response?.status) {
    toast.success(response.message || "User created successfully");

    setTimeout(() => {
      navigate("/user-listing");
    }, 1500);
  } else {
    toast.warning(response.message || "Something went wrong");
  }
    } catch (error) {
      const backendMessage =
    error?.data?.message ||
    error?.error ||
    "Server error. Please try again.";

  toast.error(backendMessage);
  console.error("Create user error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setEmployeeNumber(""); // ✅
    setDesignation(""); // ✅
    setDepartment("");
    setIsDmsUser(false);
    setUsername("");
    setUserRole([]);
   
    setErrors({});
  };

  return (
    <BasicLayout image={bgImage} showNavbarFooter={false}>
      <Card sx={{ width: 600, mx: "auto", mt: 10, mb: 10 }}>
        <MDBox
          borderRadius="lg"
          sx={{
            background: "linear-gradient(212deg, #d5b282, #f5e0c3)",
            borderRadius: "lg",
            mx: 2,
            mt: -3,
            p: 2,
            mb: 1,
            textAlign: "center",
          }}
        >
          <MDTypography variant="h3" fontWeight="medium" color="#344767" mt={1}>
            Add User
          </MDTypography>
        </MDBox>

        <MDBox mt={2} mb={1} display="flex" justifyContent="flex-end">
          <MDButton
            variant="outlined"
            color="error"
            size="small"
            onClick={handleClear}
            sx={{ marginRight: "20px" }}
          >
            Clear
          </MDButton>
        </MDBox>

        <MDBox pb={3} px={3}>
          <MDBox component="form" role="form" onSubmit={handleSubmit} sx={{ padding: 3 }}>
            <MDBox mb={3}>
              <MDInput
                type="text"
                label="First Name"
                fullWidth
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                error={!!errors.firstName}
                helperText={errors.firstName}
              />
            </MDBox>
            <MDBox mb={3}>
              <MDInput
                type="text"
                label="Last Name"
                fullWidth
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                error={!!errors.lastName}
                helperText={errors.lastName}
              />
            </MDBox>
            <MDBox mb={3}>
              <MDInput
                type="email"
                label="Email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
              />
            </MDBox>
            
            <MDBox mb={3}>
              <MDInput
                type="text"
                label="Username"
                fullWidth
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={!!errors.username}
                helperText={errors.username}
              />
            </MDBox>
            <MDBox mb={3}>
              <MDInput
                type="text"
                label="Employee Number"
                fullWidth
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
                error={!!errors.employeeNumber}
                helperText={errors.employeeNumber}
              />
            </MDBox>

            {/* ✅ Designation */}
            <MDBox mb={3}>
              <MDInput
                type="text"
                label="Designation"
                fullWidth
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                error={!!errors.designation}
                helperText={errors.designation}
                multiline
                rows={3}
              />
            </MDBox>
            <MDBox mb={3} display="flex" alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={isDmsUser}
                    onChange={(e) => setIsDmsUser(e.target.checked)}
                    color="primary"
                  />
                }
                label="DMS User"
              />
            </MDBox>
            <MDBox mb={3}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="select-role-label">User Role</InputLabel>
                <Select
                  labelId="select-role-label"
                  id="select-role"
                  multiple
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  input={<OutlinedInput label="User Role" />}
                  sx={{
                    minWidth: 200,
                    height: "3rem",
                    ".MuiSelect-select": {
                      padding: "0.75rem",
                    },
                  }}
                  renderValue={(selected) =>
                    selected.map((roleId) => {
                      const role = userRoles.find((r) => r.id === roleId);
                      return role?.name || roleId;
                    }).join(', ')
                  }
                  error={!!errors.userRole}
                >
                  {userRoles.length > 0 ? (
                    userRoles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No roles available</MenuItem>
                  )}
                </Select>
                {errors.userRole && (
                  <p style={{ color: "red", fontSize: "0.75rem", marginTop: "4px" }}>
                    {errors.userRole}
                  </p>
                )}
              </FormControl>
            </MDBox>
            <MDBox mb={3}>
              <FormControl fullWidth margin="dense" error={!!errors.department}>
                <InputLabel id="select-department-label">Department</InputLabel>
                <Select
                  labelId="select-department-label"
                  id="select-department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  input={<OutlinedInput label="Department" />}
                  sx={{ minWidth: 200, height: "3rem", ".MuiSelect-select": { padding: "0.75rem" } }}
                >
                  {isDepartmentsLoading ? (
                    <MenuItem disabled>Loading departments...</MenuItem>
                  ) : (
                    (departmentsData || []).map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.department_name}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {errors.department && (
                  <p style={{ color: "red", fontSize: "0.75rem", marginTop: "4px" }}>{errors.department}</p>
                )}
              </FormControl>
            </MDBox>

            <MDBox mt={2} mb={1}>
              <MDButton
                variant="gradient"
                color="submit"
                fullWidth
                type="submit"
                  // disabled={isLoading || isSubmitting}
              >
                Submit
              </MDButton>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>
      {/* <ToastContainer /> */}

      {/* E-Signature Dialog */}
      <ESignatureDialog
        open={openSignatureDialog}
        onClose={() => setOpenSignatureDialog(false)}
        onConfirm={handleSignatureComplete}
      />
    </BasicLayout>
  );
}

export default AddUser;