// src/components/DashboardNavbar.js
import { useState, useEffect } from "react";
import { useLocation, Link, useNavigate, Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import { Link as RouterLink } from "react-router-dom";
import { styled } from "@mui/material/styles";
// Material-UI core components
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import InputAdornment from "@mui/material/InputAdornment";
import Menu from "@mui/material/Menu";
import MDButton from "components/MDButton";
import MenuItem from "@mui/material/MenuItem";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  FormControlLabel,
  Switch,
  Stack,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import MDBox from "components/MDBox";
import MDInput from "components/MDInput";
import Breadcrumbs from "examples/Breadcrumbs";
import {
  navbar,
  navbarContainer,
  navbarRow,
  navbarIconButton,
  navbarMobileMenu,
} from "examples/Navbars/DashboardNavbar/styles";
import axios from "axios";
// Material Dashboard 2 React context
import {
  useMaterialUIController,
  setTransparentNavbar,
  setMiniSidenav,
  setOpenConfigurator,
} from "context";
import { useAuth } from "hooks/use-auth";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
// Import the API hook for switching roles
import { useRequestUserGroupListQuery, useUserSwitchRoleMutation } from "api/auth/switchRoleApi";
import { setUserDetails } from "slices/userRoleSlice";
import { useGetemployeeRecordlogQuery, useGetEmployeeTrainingExcelQuery } from "apilms/reportsApi";
function DashboardNavbar({ absolute, light, isMini }) {
  const [navbarType, setNavbarType] = useState();
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav, transparentNavbar, fixedNavbar, openConfigurator, darkMode } = controller;
  const { data, error } = useGetemployeeRecordlogQuery();
  // Fetch data for Employee Training Excel Report
  const {
    data: trainingData,
    error: trainingError,
    isLoading: trainingLoading,
  } = useGetEmployeeTrainingExcelQuery();
  const route = useLocation().pathname.split("/").slice(1);
  const { user, role } = useAuth();
  const [roles, setRoles] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [password, setPassword] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorReportEl, setAnchorReportEl] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const navigate = useNavigate();
  // Fetch roles using the API hook
  const dispatch2 = useDispatch();
  const { data: rolesData, isLoading, isError } = useRequestUserGroupListQuery();
  // console.log("RolesData:::",rolesData)
  const { is_dms_user, is_lms_user, is_active } = useSelector((state) => state.userRole);
  const group = user?.user_permissions?.group || {};
  const groupId = group.id;

  const handleToggle = (event) => {
    dispatch2(
      setUserDetails({
        is_dms_user,
        is_lms_user,
        is_active: !is_active,
      })
    );
    if (is_active) {
      console.log("Is Active.Toggle Off", is_active);
      navigate("/dashboard");
    } else {
      console.log("Is Active.Toggle On", is_active);
      navigate("/lms-dashboard");
    }
    // console.log("Is DMS USER:,",is_dms_user)
    // console.log("Is LMS USER:,",is_lms_user)
  };
  // console.log(is_active)
  const [
    userSwitchRole,
    { isLoading: isSwitchLoading, isError: isSwitchError, data: switchData, error: switchError },
  ] = useUserSwitchRoleMutation();
  const handleOpenReportSubMenu = (event) => {
    setAnchorReportEl(event.currentTarget);
  };
  const handleCloseReportSubMenu = () => {
    setAnchorReportEl(null);
  };

  const handleDownloadReport = async () => {
    if (isLoading) {
      toast.info("Generating the report, please wait...");
      return;
    }

    if (error) {
      toast.error("Error fetching employee record log.");
      return;
    }

    if (data && data.status && data.data) {
      const fileUrl = data.data;
      try {
        // Download the file using Axios
        const response = await axios.get(fileUrl, { responseType: "blob" });

        // Create a link element to trigger the download
        const link = document.createElement("a");
        const file = new Blob([response.data], { type: "application/pdf" });
        link.href = URL.createObjectURL(file);
        link.download = fileUrl.split("/").pop(); // Extract filename from URL
        link.click();

        // Show success toast
        toast.success("Report downloaded successfully!");
      } catch (err) {
        // Show error toast
        toast.error(`Failed to download report: ${err.message}`);
      }
    } else {
      toast.error("Failed to generate report.");
    }
  };

  const handleDownloadTrainingExcelReport = async () => {
    console.log("Fetching training report...");

    if (trainingLoading) {
      toast.info("Generating the training report, please wait...");
      return;
    }

    if (trainingError) {
      console.error("API Error:", trainingError);
      toast.error("Error fetching employee training report.");
      return;
    }

    console.log("API Response:", trainingData);

    if (trainingData && trainingData.status && trainingData.data) {
      const fileUrl = trainingData.data;
      console.log("Downloading file from:", fileUrl);

      try {
        const response = await axios.get(fileUrl, { responseType: "blob" });

        const link = document.createElement("a");
        const file = new Blob([response.data], { type: "application/vnd.ms-excel" });
        link.href = URL.createObjectURL(file);
        link.download = fileUrl.split("/").pop();
        link.click();

        toast.success("Training report downloaded successfully!");
      } catch (err) {
        console.error("Download Error:", err);
        toast.error(`Failed to download training report: ${err.message}`);
      }
    } else {
      console.warn("Unexpected API Response Format:", trainingData);
      toast.error("Failed to generate training report.");
    }
  };

  useEffect(() => {
    if (rolesData && rolesData.data) {
      const fetchedRoles = rolesData.data.map((role) => ({
        id: role.id,
        name: role.name,
      }));
      setRoles(fetchedRoles);
    }
  }, [rolesData, isLoading, isError]);

  useEffect(() => {
    if (fixedNavbar) {
      setNavbarType("sticky");
    } else {
      setNavbarType("static");
    }

    function handleTransparentNavbar() {
      setTransparentNavbar(dispatch, false);
    }
    window.addEventListener("scroll", handleTransparentNavbar);
    handleTransparentNavbar();

    return () => window.removeEventListener("scroll", handleTransparentNavbar);
  }, [dispatch, fixedNavbar]);

  const handleMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav);

  const handleSettingsClick = (event) => setAnchorEl(event.currentTarget);
  const handleCloseSettings = () => setAnchorEl(null);

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setFeedbackMessage("");
  };

  const handleRoleChange = (event) => setSelectedRole(event.target.value);
  const handlePasswordChange = (event) => setPassword(event.target.value);

  const handleSubmit = async () => {
    if (password && selectedRole) {
      try {
        // Call the mutation to switch the role
        const response = await userSwitchRole({ group_id: selectedRole, password });
        if (response.data.status) {
          setFeedbackMessage("Role switched successfully!");
        } else {
          setFeedbackMessage("Failed to switch role.");
        }
      } catch (err) {
        setFeedbackMessage("Error switching role: " + err.message);
      }
      handleClose();
    } else {
      setFeedbackMessage("Please select a role and enter a password.");
    }
  };
  const isButtonVisible = () => {
    return roles.some((role) => role.id === 1);
  };

  const iconsStyle = ({ palette: { dark, white, text }, functions: { rgba } }) => ({
    color: () => {
      let colorValue = light || darkMode ? white.main : dark.main;
      if (transparentNavbar && !light) {
        colorValue = darkMode ? rgba(text.main, 0.6) : text.main;
      }
      return colorValue;
    },
  });

  const AntSwitch = styled(Switch)(({ theme }) => ({
    width: 28,
    height: 16,
    padding: 0,
    display: "flex",
    "&:active": {
      "& .MuiSwitch-thumb": {
        width: 15,
      },
      "& .MuiSwitch-switchBase.Mui-checked": {
        transform: "translateX(9px)",
      },
    },
    "& .MuiSwitch-switchBase": {
      padding: 2,
      "&.Mui-checked": {
        transform: "translateX(12px)",
        color: "#fff",
        "& + .MuiSwitch-track": {
          opacity: 1,
          backgroundColor: "#1890ff",
          ...theme.applyStyles("dark", {
            backgroundColor: "#177ddc",
          }),
        },
      },
    },
    "& .MuiSwitch-thumb": {
      boxShadow: "0 2px 4px 0 rgb(0 35 11 / 20%)",
      width: 12,
      height: 12,
      borderRadius: 6,
      transition: theme.transitions.create(["width"], {
        duration: 200,
      }),
    },
    "& .MuiSwitch-track": {
      borderRadius: 16 / 2,
      opacity: 1,
      backgroundColor: "rgba(0,0,0,.25)",
      boxSizing: "border-box",
      ...theme.applyStyles("dark", {
        backgroundColor: "rgba(255,255,255,.35)",
      }),
    },
  }));

  return (
    <AppBar
      position={absolute ? "absolute" : navbarType}
      color={light ? "default" : "inherit"}
      sx={(theme) => navbar(theme, { transparentNavbar, absolute, light, darkMode })}
    >
      <Toolbar sx={(theme) => navbarContainer(theme)}>
        <MDBox color="inherit" mb={{ xs: 1, md: 0 }} sx={(theme) => navbarRow(theme, { isMini })}>
          <Breadcrumbs icon="home" title={route[route.length - 1]} route={route} light={light} />
        </MDBox>

        {!isMini && (
          <MDBox sx={(theme) => navbarRow(theme, { isMini })}>
            {/* <FormControlLabel
              control={
                <Switch checked={false} onChange={()=>{}} name="antoine" />
              }
              label="Antoine Llorca"
            /> */}
            {/* <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography>DMS</Typography>
              <AntSwitch defaultChecked inputProps={{ 'aria-label': 'ant design' }} />
              <Typography>LMS</Typography>
            </Stack> */}
            {is_dms_user && (
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography sx={{ fontSize: "17px" }}>DMS</Typography>
                <AntSwitch
                  checked={is_active} // Switch position based on is_active
                  onChange={handleToggle}
                  inputProps={{ "aria-label": "ant design" }}
                />
                <Typography sx={{ fontSize: "17px" }}>LMS</Typography>
              </Stack>
            )}

            <MDBox pr={1}>
              <Button
                endIcon={<AccountCircleIcon />}
                variant="text"
                size="large"
                sx={navbarIconButton}
              // onClick={handleClickOpen}
              >
                {role}
              </Button>
            </MDBox>
            {isButtonVisible() && (
              <MDBox pr={1}>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    backgroundColor: "#e91e63",
                    color: "white !important",
                    padding: "6px 16px",
                    minHeight: "36px",
                    "&:hover": {
                      backgroundColor: "#d81b60",
                    },
                  }}
                  component={RouterLink}
                  to="/roles-listing"
                >
                  Roles
                </Button>
              </MDBox>
            )}

            <MDBox color={light ? "white" : "inherit"} display="flex" alignItems="center">
              <Dialog
                open={open}
                onClose={handleClose}
                fullWidth
                maxWidth="md"
                sx={{ "& .MuiDialog-paper": { width: "30vw", height: "42vh" } }}
              >
                <DialogTitle sx={{ textAlign: "center" }}>Change Role</DialogTitle>
                <DialogContent>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="role-select-label" sx={{ height: "2.5rem" }}>
                      Select Role
                    </InputLabel>
                    <Select
                      labelId="role-select-label"
                      value={selectedRole}
                      onChange={handleRoleChange}
                      label="Select Role"
                      sx={{
                        height: "3rem",
                        ".MuiSelect-select": {
                          padding: "0.75rem",
                        },
                      }}
                    >
                      {isLoading ? (
                        <MenuItem disabled>
                          <CircularProgress size={20} />
                        </MenuItem>
                      ) : isError ? (
                        <MenuItem disabled>Error loading roles</MenuItem>
                      ) : roles.length > 0 ? (
                        roles.map((role) => (
                          <MenuItem key={role.id} value={role.id}>
                            {role.name}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No roles available</MenuItem>
                      )}
                    </Select>
                  </FormControl>
                  <MDBox mb={3}>
                    <MDInput
                      type={showPassword ? "text" : "password"}
                      label="Password"
                      fullWidth
                      value={password}
                      onChange={handlePasswordChange}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </MDBox>
                  {feedbackMessage && (
                    <Alert severity={feedbackMessage.includes("Failed") ? "error" : "success"}>
                      {feedbackMessage}
                    </Alert>
                  )}
                </DialogContent>
                <DialogActions>
                  <MDButton onClick={handleClose} color="error" sx={{ marginRight: "10px" }}>
                    Cancel
                  </MDButton>
                  <MDBox>
                    <MDButton
                      variant="gradient"
                      color="submit"
                      fullWidth
                      onClick={handleSubmit}
                      disabled={isSwitchLoading}
                    >
                      {isSwitchLoading ? "Switching..." : "Submit"}
                    </MDButton>
                  </MDBox>
                </DialogActions>
              </Dialog>

              <IconButton
                size="large"
                disableRipple
                sx={navbarMobileMenu}
                onClick={handleMiniSidenav}
              >
                <Icon sx={iconsStyle}>{miniSidenav ? "menu_open" : "menu"}</Icon>
              </IconButton>
              <IconButton
                size="small"
                disableRipple
                sx={navbarIconButton}
                onClick={handleSettingsClick}
              >
                <Icon sx={iconsStyle}>settings</Icon>
              </IconButton>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseSettings}>
                <MenuItem component={RouterLink} to="/update-password">
                  Change Password
                </MenuItem>

                {/* Report menu item with submenu */}
                {groupId === 7 && (
                  <>
                    <MenuItem onClick={handleOpenReportSubMenu}>Report</MenuItem>
                    <Menu
                      anchorEl={anchorReportEl}
                      open={Boolean(anchorReportEl)}
                      onClose={handleCloseReportSubMenu}
                      MenuListProps={{
                        "aria-labelledby": "report-menu-item",
                      }}
                    >
                      <MenuItem onClick={handleDownloadReport}>Employee Record Log Report</MenuItem>
                      <MenuItem onClick={handleDownloadTrainingExcelReport}>
                        Employee Training Excel Report
                      </MenuItem>
                    </Menu>
                  </>
                )}

                <MenuItem component={RouterLink} to="/logout">
                  Logout
                </MenuItem>
              </Menu>
            </MDBox>
          </MDBox>
        )}
      </Toolbar>
    </AppBar>
  );
}

DashboardNavbar.propTypes = {
  absolute: PropTypes.bool,
  light: PropTypes.bool,
  isMini: PropTypes.bool,
};

DashboardNavbar.defaultProps = {
  absolute: false,
  light: false,
  isMini: false,
};

export default DashboardNavbar;
