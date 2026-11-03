import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import Card from "@mui/material/Card";
import { DataGrid } from "@mui/x-data-grid";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import moment from "moment";
import ESignatureDialog from "layouts/authentication/ESignatureDialog";
import { toast, ToastContainer } from "react-toastify";
import { useClassroomQuestionsGetQuery } from "apilms/classtestApi";

const ClassQuestion = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();
  // const classroom = location?.state?.classroom || null;
  // const classroom_id = classroom?.classroom_id || null;

  const {classroomId} = useParams()
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const [pendingQuestionId, setPendingQuestionId] = useState(null);
  const navigate = useNavigate();

  // Fetch questions for the classroom using the classroom_id
  const { data, isLoading, isError,refetch } = useClassroomQuestionsGetQuery(classroomId);
  const questions = data?.data || []; // Access the 'data' field, or default to an empty array if it's not available
  
  useEffect(() => {
    refetch(); // Trigger refetch on mount
  }, [refetch]);

  const handleAddQuestion = () => {
    navigate("/class-add-question", { state: { classroomId } });
  };

  // Handle search input change
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  // Handle editing a question
  const handleEditQuestion = (row) => {
    navigate("/edit-question", { state: { item: row.fullData } });
  };

  // Handle delete question action
  // const handleDeleteQuestion = (rowId) => {
  //   setPendingQuestionId(rowId);
  //   setOpenSignatureDialog(true); // Open the signature dialog
  // };

  // Handle E-Signature completion
  // const handleSignatureComplete = async (password) => {
  //   setOpenSignatureDialog(false); // Close the dialog

  //   if (!password) {
  //     toast.error("E-Signature is required to proceed.");
  //     return;
  //   }

  //   try {
  //     // Proceed with the delete action after successful signature
  //     const updatedData = questions.filter((question) => question.id !== pendingQuestionId);
  //     toast.success("Question deleted successfully!");

  //     // Update state or redirect if necessary
  //     setTimeout(() => {
  //       navigate("/trainingListing");
  //     }, 1500);
  //   } catch (error) {
  //     console.error("Error deleting question:", error);
  //     toast.error("Error deleting question. Please try again.");
  //   }
  // };

  // Filter the data based on the search term
  const filteredData = questions
    ? questions
        .filter((item) => item.question_text.toLowerCase().includes(searchTerm.toLowerCase()))
        .map((item, index) => ({
          id: item.id,
          serial_number: index + 1,
          question: item.question_text,
          question_type: item.question_type,
          created_at: moment(item.question_created_at).format("DD/MM/YY"), // Format the date
          fullData: item, // Include the full data for editing or deleting
        }))
    : [];

  const columns = [
    { field: "serial_number", headerName: "Sr. No.", flex: 0.5, headerAlign: "center" },
    { field: "question", headerName: "Question", flex: 1, headerAlign: "center" },
    { field: "question_type", headerName: "Question Type", flex: 1, headerAlign: "center" },
    { field: "created_at", headerName: "Created Date", flex: 1, headerAlign: "center" },
    //   {
    //     field: "actions", headerName: "Actions", flex: 1, headerAlign: "center", renderCell: (params) => (
    //       <>
    //         <IconButton onClick={() => handleEditQuestion(params.row)}>
    //           <EditIcon />
    //         </IconButton>
    //         <IconButton onClick={() => handleDeleteQuestion(params.row.id)}>
    //           <DeleteIcon />
    //         </IconButton>
    //       </>
    //     )
    //   }
  ];

  return (
    <MDBox p={3}>
      <Card sx={{ maxWidth: "80%", mx: "auto", mt: 3, marginLeft: "auto", marginRight: 0 }}>
        <MDBox p={3} display="flex" alignItems="center">
          <MDInput
            label="Search Question"
            variant="outlined"
            size="small"
            sx={{ width: "250px", mr: 2 }}
            value={searchTerm}
            onChange={handleSearch}
          />
          <MDTypography variant="h4" fontWeight="medium" sx={{ flexGrow: 1, textAlign: "center" }}>
            Class Question Listing
          </MDTypography>
          <MDButton variant="contained" color="primary" onClick={handleAddQuestion} sx={{ ml: 2 }}>
            Add Question
          </MDButton>
        </MDBox>
        <MDBox display="flex" justifyContent="center" p={2}>
          <div style={{ height: 500, width: "100%" }}>
            <DataGrid
              rows={filteredData}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5, 10, 20]}
              disableSelectionOnClick
              sx={{
                border: "1px solid #ddd",
                borderRadius: "4px",
                "& .MuiDataGrid-columnHeaders": {
                  display: "flex",
                  justifyContent: "center",
                  backgroundColor: "#f5f5f5",
                  fontWeight: "bold",
                },
                "& .MuiDataGrid-cell": {
                  textAlign: "center",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                },
              }}
            />
          </div>
        </MDBox>
      </Card>

      {/* E-Signature Dialog
        <ESignatureDialog
          open={openSignatureDialog}
          onClose={() => setOpenSignatureDialog(false)}
          onConfirm={handleSignatureComplete} // Pass the handler for signature completion
        /> */}
     
    </MDBox>
  );
};

export default ClassQuestion;
