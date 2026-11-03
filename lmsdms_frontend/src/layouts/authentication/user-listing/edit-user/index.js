import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import BasicLayout from "layouts/authentication/components/BasicLayout";
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import { FormControl, InputLabel, Select, MenuItem, OutlinedInput, FormControlLabel, Switch } from "@mui/material";
import { useUpdateUserMutation } from "api/auth/userApi";
import { useFetchDepartmentsQuery } from "api/auth/departmentApi";
import { getUserGroups } from "api/auth/auth";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ESignatureDialog from "layouts/authentication/ESignatureDialog";

function EditUser() {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = location.state?.user || JSON.parse(localStorage.getItem("userData")) || {};
  const [firstName, setFirstName] = useState(userData.first_name || "");
  const [lastName, setLastName] = useState(userData.last_name || "");
  const [email, setEmail] = useState(userData.email || "");

  const [username, setUsername] = useState(userData.username || "");
  const [userRole, setUserRole] = useState(
    userData.groups_list ? userData.groups_list.split(",").map(Number) : []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRoles, setUserRoles] = useState([userData.groups_list]);
  const [errors, setErrors] = useState({});
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const [designation, setDesignation] = useState(userData.designation || ""); // ✅ New
  const [employeeNumber, setEmployeeNumber] = useState(userData.employee_number || ""); // ✅ New
  const [isDmsUser, setIsDmsUser] = useState(userData.is_dms_user || false);
  const [updateUser] = useUpdateUserMutation();
  console.log(userData);
  const { data: departmentsData } = useFetchDepartmentsQuery();

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
    if (!username.trim()) newErrors.username = "Username is required.";
    if (!designation.trim()) newErrors.designation = "Designation is required.";
    if (!employeeNumber.trim()) newErrors.employeeNumber = "Employee Number is required.";
    if (!userRole.length) newErrors.userRole = "User Role is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  useEffect(() => {
    if (location.state?.user) {
      localStorage.setItem("userData", JSON.stringify(location.state.user));
    }
  }, [location.state?.user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!validateInputs()) {
      toast.error("Please fill all required fields.");
      setIsSubmitting(false);
      return;
    }
    setOpenSignatureDialog(true);
  };

  const handleSignatureComplete = async (password) => {
    setOpenSignatureDialog(false);
    if (!password) {
      toast.error("E-Signature is required to proceed.");
      setIsSubmitting(false);
      return;
    }

    const updatedUserData = {
      id: userData.id,
      first_name: firstName,
      last_name: lastName,
      designation, // ✅ Added
      employee_number: employeeNumber, // ✅ Added
      is_dms_user: isDmsUser,
      email,
      username,
      groups: userRole,
    };

    try {
      await updateUser(updatedUserData).unwrap();
      toast.success("User updated successfully!");
      setTimeout(() => {
        navigate("/user-listing");
      }, 1500);
    } catch (error) {
      toast.error("Failed to update user. Please try again.");
      console.error("Failed to update user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BasicLayout image={bgImage} showNavbarFooter={false}>
      <Card sx={{ width: 600, mx: "auto", mt: 10, mb: 10 }}>
        <MDBox
          borderRadius="lg"
          sx={{
            background: "linear-gradient(212deg, #d5b282, #f5e0c3)",
            mx: 2,
            mt: -3,
            p: 2,
            mb: 1,
            textAlign: "center",
          }}
        >
          <MDTypography variant="h3" fontWeight="medium" color="#344767" mt={1}>
            Edit User
          </MDTypography>
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
                type="number" // 👈 only allows numbers
                label="Employee Number"
                fullWidth
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value.replace(/\D/, ""))} // 👈 remove any non-digit
                error={!!errors.employeeNumber}
                helperText={errors.employeeNumber}
                inputProps={{
                  min: 0, // 👈 optional — prevents negative numbers
                  step: 1, // 👈 ensures integers only
                }}
              />
            </MDBox>

            <MDBox mb={3}>
              <MDInput
                multiline
                rows={2}
                type="text"
                label="Designation"
                fullWidth
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                error={!!errors.designation}
                helperText={errors.designation}
              />
            </MDBox>

            <MDBox mb={3}>
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
                    selected
                      .map((roleId) => {
                        if (!userRoles || userRoles.length === 0) return `Unknown Role (${roleId})`;
                        const role = userRoles.find((r) => Number(r.id) === Number(roleId));
                        return role ? role.name : `Unknown Role (${roleId})`;
                      })
                      .join(", ")
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

      <ESignatureDialog
        open={openSignatureDialog}
        onClose={() => setOpenSignatureDialog(false)}
        onConfirm={handleSignatureComplete}
      />
    </BasicLayout>
  );
}

export default EditUser;
