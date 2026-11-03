// Import necessary components
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import BasicLayout from "layouts/authentication/components/BasicLayout";
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
} from "@mui/material";

const approvalStatuses = ["Approved", "Sent Back"];
const departments = ["HR", "Finance", "IT", "Sales"]; // Example options for 'Sent Back To'

function ReviewDocument() {
  const [documentName, setDocumentName] = useState("");
  const [reviewer, setReviewer] = useState(""); // Reviewer will be auto-filled
  const [comments, setComments] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("");
  const [sentBackTo, setSentBackTo] = useState("");
  const [reviewedAt, setReviewedAt] = useState(""); // Auto-filled on form load

  const navigate = useNavigate(); // Initialize useNavigate for navigation

  useEffect(() => {
    // Auto-fill reviewer and reviewedAt based on user role and current date
    const currentUserRole = "Reviewer"; // This should be dynamic based on the logged-in user
    const currentDate = new Date().toISOString().split("T")[0]; // Format as YYYY-MM-DD
    setReviewer(currentUserRole);
    setReviewedAt(currentDate);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log("Review Document Submitted:", {
      documentName,
      reviewer,
      comments,
      approvalStatus,
      sentBackTo,
      reviewedAt,
    });
    navigate("/dashboard");
  };
  const handleClear = () => {
    setDocumentName("");
    setComments("");
    setApprovalStatus("");
    setSentBackTo("");
  };

  return (
    <BasicLayout image={bgImage} showNavbarFooter={false}>
      <Card sx={{ width: 600, mx: "auto" }}>
        <MDBox
         borderRadius="lg"
         sx={{
          background: "linear-gradient(212deg, #d5b282, #f5e0c3)", // Custom color gradient
          borderRadius: "lg",
          // boxShadow: "0 4px 20px 0 rgba(213, 178, 130, 0.5)", // Custom colored shadow
          mx: 2,
          mt: -3,
          p: 2,
          mb: 1,
          textAlign: "center",
        }}
        >
          <MDTypography variant="h3" fontWeight="medium" color="#344767" mt={1}>
            Review Document
          </MDTypography>
        </MDBox>
        <MDBox mt={2} mb={1} display="flex" justifyContent="flex-end">
          <MDButton
            variant="outlined"
            color="error"
            size="small" // Set the button size to small
            onClick={handleClear}
            sx={{ marginRight: '20px' }}
          >
            Clear
          </MDButton>
        </MDBox>
        <MDBox pb={3} px={3}>
          <MDBox component="form" role="form" onSubmit={handleSubmit} sx={{ padding: 3 }}>
            <MDBox mb={3}>
              <MDInput
                type="text"
                label="Document Name"
                fullWidth
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
              />
            </MDBox>
            <MDBox mb={3}>
              <MDInput
                type="text"
                label="Reviewer"
                fullWidth
                value={reviewer}
                disabled 
              />
            </MDBox>
            <MDBox mb={3}>
              <MDInput
                type="text"
                label="Comments"
                fullWidth
                multiline
                rows={4} 
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </MDBox>
            <MDBox mb={3}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="select-approval-status-label">Approval Status</InputLabel>
                <Select
                  labelId="select-approval-status-label"
                  id="select-approval-status"
                  value={approvalStatus}
                  onChange={(e) => setApprovalStatus(e.target.value)}
                  input={<OutlinedInput label="Approval Status" />}
                  sx={{ minWidth: 200,
                    height: "3rem", // Adjust the height here
                    ".MuiSelect-select": {
                      padding: "0.45rem", // Adjust padding for the select input text
                    },
                   }}
                >
                  {approvalStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </MDBox>
            {approvalStatus === "Sent Back" && (
              <MDBox mb={3}>
                <FormControl fullWidth margin="dense">
                  <InputLabel id="select-sent-back-to-label">Sent Back To</InputLabel>
                  <Select
                    labelId="select-sent-back-to-label"
                    id="select-sent-back-to"
                    value={sentBackTo}
                    onChange={(e) => setSentBackTo(e.target.value)}
                    input={<OutlinedInput label="Sent Back To" />}
                    sx={{ minWidth: 200 }}
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </MDBox>
            )}
            <MDBox mb={3}>
              <MDInput
                type="text"
                label="Reviewed At"
                fullWidth
                value={reviewedAt}
                disabled // Reviewed date is auto-filled and non-editable
              />
            </MDBox>
            <MDBox mt={2} mb={1}>
              <MDButton variant="gradient" color="submit" fullWidth type="submit">
                Submit
              </MDButton>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>
    </BasicLayout>
  );
}

export default ReviewDocument;
