import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import MDButton from "components/MDButton";
import {
  useCreateJobDescriptionMutation,
  useGetJobDescriptionListQuery,
  useSaveDescriptionMutation,
} from "apilms/jobRoleApi";
import { toast } from "react-toastify";
import { getErrorMessage } from "services/baseQuery";

const JobDescriptionDialog = ({ open, onClose, userId, remark }) => {
  const [jobDescription, setJobDescription] = useState("");

  // Fetch job descriptions for the given user
  const {
    data,
    isLoading: isDataLoading,
    isError: isDataError,
    refetch, // To refresh data when opening dialog
  } = useGetJobDescriptionListQuery(userId, { skip: !userId });

  const [createJobDescription, { isLoading }] = useCreateJobDescriptionMutation();
  const [saveDescription, { isLoading: isSaveLoading }] = useSaveDescriptionMutation();

  // Fetch job description when data is available or dialog opens
  useEffect(() => {
    if (open) {
      refetch(); // Fetch the latest data every time the dialog opens

      if (data?.data?.length > 0) {
        // Prioritize "send_back" status if available, otherwise take "draft"
        const jobDesc = data.data.find((item) => item.status === "send_back") ||
                        data.data.find((item) => item.status === "draft");

        setJobDescription(jobDesc ? jobDesc.employee_job_description : "");
      } else {
        setJobDescription(""); // Clear if no data
      }
    }
  }, [open, data]);

  const handleChange = (event) => setJobDescription(event.target.value);

  const handleSubmit = async () => {
    if (jobDescription.trim()) {
      try {
        await createJobDescription({
          user_id: userId,
          employee_job_description: jobDescription,
        }).unwrap();
        toast.success("Job description assigned successfully!");
        onClose(); // Close dialog
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to save job description. Please try again."));
      }
    } else {
      toast.warning("Please enter a job description.");
    }
  };

  const handleSave = async () => {
    if (!jobDescription.trim()) {
      toast.warning("Please enter a job description.");
      return;
    }

    try {
      await saveDescription({ user_id: userId, employee_job_description: jobDescription }).unwrap();
      toast.success("Job description saved successfully!");
      onClose();
    } catch (error) {
      console.error("Error saving job description:", error);
      toast.error(getErrorMessage(error, "Failed to save job description. Please try again."));
    }
  };

  const handleCancel = () => {
    setJobDescription(""); // Clear input
    onClose(); // Close dialog
  };

  return (
    <Dialog  open={open} onClose={handleCancel} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{ textAlign: "center", fontWeight: "bold", fontSize: "1.25rem", color: "#333" }}
      >
        {remark ? "Assign Job Description to Send Back by HOD" : "Assign Job Description"}
      </DialogTitle>
      <DialogContent>
        {remark && (
          <TextField
            margin="dense"
            label="Remark"
            type="text"
            fullWidth
            value={remark}
            InputProps={{ readOnly: true }}
            sx={{ marginBottom: 2, backgroundColor: "#f4f6f8" }}
          />
        )}
        <TextField
          autoFocus
          margin="dense"
          label="Job Description"
          type="text"
          fullWidth
          value={jobDescription}
          onChange={handleChange}
          required
          multiline
          rows={8}
        />
      </DialogContent>
      <DialogActions>
        <MDButton onClick={handleSave} variant="gradient" color="submit" disabled={isSaveLoading}>
          {isSaveLoading ? "Saving..." : "Save"}
        </MDButton>
        <MDButton onClick={handleCancel} color="error">
          Cancel
        </MDButton>
        <MDButton onClick={handleSubmit} variant="gradient" color="submit" disabled={isLoading}>
          {isLoading ? "Submitting..." : "Submit"}
        </MDButton>
      </DialogActions>
      {isDataError && (
        <div style={{ color: "red", padding: "10px", textAlign: "center" }}>
          Failed to load job descriptions.
        </div>
      )}
    </Dialog>
  );
};

JobDescriptionDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  userId: PropTypes.number.isRequired,
  remark: PropTypes.string,
};

export default JobDescriptionDialog;


// import React, { useState, useEffect } from "react";
// import PropTypes from "prop-types";
// import {
//   Dialog,
//   DialogActions,
//   DialogContent,
//   DialogTitle,
//   TextField,
//   MenuItem,
// } from "@mui/material";
// import MDButton from "components/MDButton";

// import {
//   useCreateJobDescriptionMutation,
//   useGetJobDescriptionListQuery,
//   useSaveDescriptionMutation,
  
// } from "apilms/jobRoleApi";
// import { toast } from "react-toastify";
// const { data, isLoading, error } = useGetJobRoleQuery();
// const JobDescriptionDialog = ({ open, onClose, userId, remark }) => {
//   const [jobDescription, setJobDescription] = useState("");
//   const [jobRoleId, setJobRoleId] = useState("");

//   // 🔹 Fetch job descriptions
//   const {
//     data,
//     isError: isDataError,
//     refetch,
//   } = useGetJobDescriptionListQuery(userId, { skip: !userId });

//   // 🔹 Fetch job roles
//   const { data: jobRolesData } = useGetJobRolesQuery();

//   const [createJobDescription, { isLoading }] =
//     useCreateJobDescriptionMutation();
//   const [saveDescription, { isLoading: isSaveLoading }] =
//     useSaveDescriptionMutation();

//   // 🔹 Load data on dialog open
//   useEffect(() => {
//     if (open) {
//       refetch();

//       if (data?.data?.length > 0) {
//         const jobDesc =
//           data.data.find((item) => item.status === "send_back") ||
//           data.data.find((item) => item.status === "draft");

//         setJobDescription(jobDesc?.employee_job_description || "");
//         setJobRoleId(jobDesc?.job_role?.id || "");
//       } else {
//         setJobDescription("");
//         setJobRoleId("");
//       }
//     }
//   }, [open, data, refetch]);

//   const handleSubmit = async () => {
//     if (!jobRoleId) {
//       toast.warning("Please select a job role.");
//       return;
//     }

//     if (!jobDescription.trim()) {
//       toast.warning("Please enter a job description.");
//       return;
//     }

//     try {
//       await createJobDescription({
//         user_id: userId,
//         job_role_id: jobRoleId,
//         employee_job_description: jobDescription,
//       }).unwrap();

//       toast.success("Job description submitted successfully!");
//       onClose();
//     } catch (error) {
//       toast.error("Failed to submit job description.");
//     }
//   };

//   const handleSave = async () => {
//     if (!jobRoleId) {
//       toast.warning("Please select a job role.");
//       return;
//     }

//     if (!jobDescription.trim()) {
//       toast.warning("Please enter a job description.");
//       return;
//     }

//     try {
//       await saveDescription({
//         user_id: userId,
//         job_role_id: jobRoleId,
//         employee_job_description: jobDescription,
//       }).unwrap();

//       toast.success("Job description saved successfully!");
//       onClose();
//     } catch (error) {
//       toast.error("Failed to save job description.");
//     }
//   };

//   const handleCancel = () => {
//     setJobDescription("");
//     setJobRoleId("");
//     onClose();
//   };

//   return (
//     <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
//       <DialogTitle
//         sx={{
//           textAlign: "center",
//           fontWeight: "bold",
//           fontSize: "1.25rem",
//         }}
//       >
//         {remark
//           ? "Assign Job Description (Send Back by HOD)"
//           : "Assign Job Description"}
//       </DialogTitle>

//       <DialogContent>
//         {remark && (
//           <TextField
//             label="Remark"
//             fullWidth
//             margin="dense"
//             value={remark}
//             InputProps={{ readOnly: true }}
//             sx={{ backgroundColor: "#f4f6f8", mb: 2 }}
//           />
//         )}

//         {/* 🔹 Job Role Dropdown */}
//         <TextField
//           select
//           label="Job Role"
//           fullWidth
//           margin="dense"
//           value={jobRoleId}
//           onChange={(e) => setJobRoleId(e.target.value)}
//           required
//         >
//           {jobRolesData?.data?.map((role) => (
//             <MenuItem key={role.id} value={role.id}>
//               {role.name}
//             </MenuItem>
//           ))}
//         </TextField>

//         {/* 🔹 Job Description */}
//         <TextField
//           label="Job Description"
//           fullWidth
//           margin="dense"
//           multiline
//           rows={8}
//           value={jobDescription}
//           onChange={(e) => setJobDescription(e.target.value)}
//           required
//         />
//       </DialogContent>

//       <DialogActions>
//         <MDButton
//           onClick={handleSave}
//           variant="gradient"
//           color="submit"
//           disabled={isSaveLoading}
//         >
//           {isSaveLoading ? "Saving..." : "Save"}
//         </MDButton>

//         <MDButton onClick={handleCancel} color="error">
//           Cancel
//         </MDButton>

//         <MDButton
//           onClick={handleSubmit}
//           variant="gradient"
//           color="submit"
//           disabled={isLoading}
//         >
//           {isLoading ? "Submitting..." : "Submit"}
//         </MDButton>
//       </DialogActions>

//       {isDataError && (
//         <div style={{ color: "red", textAlign: "center", padding: 10 }}>
//           Failed to load job description.
//         </div>
//       )}
//     </Dialog>
//   );
// };

// JobDescriptionDialog.propTypes = {
//   open: PropTypes.bool.isRequired,
//   onClose: PropTypes.func.isRequired,
//   userId: PropTypes.number.isRequired,
//   remark: PropTypes.string,
// };

// export default JobDescriptionDialog;