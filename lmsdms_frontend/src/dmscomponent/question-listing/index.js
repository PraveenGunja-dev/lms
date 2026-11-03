import React, { useState, useEffect } from "react";
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
import {
  useFetchTrainingWiseQuestionsQuery,
  useDeleteTrainingQuestionMutation,
} from "apilms/questionApi";
import ESignatureDialog from "layouts/authentication/ESignatureDialog";
import { toast, ToastContainer } from "react-toastify";
const QuestionListing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const {id} =useParams();
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const [pendingQuestionId, setPendingQuestionId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  // const id = location?.state?.rowData || null;
  const { data, isLoading, isError, refetch } = useFetchTrainingWiseQuestionsQuery(id);
  const [deleteTrainingQuestion] = useDeleteTrainingQuestionMutation(id);
  // console.log(data);
  useEffect(() => {
    refetch();
  }, [id]);

  const handleAddQuestion = () => {
    navigate("/add-question", { state: { id } });
    console.log("travell with id in add question", id);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleEditQuestion = (row) => {
    navigate("/edit-question", { state: { item: row,id } });
    console.log("navigate with this data in edit: -+-+-+-+", id);
  };

  const handleDeleteQuestion = (row) => {
    setPendingQuestionId(row);
    console.log("id to delete:", row);
    setOpenSignatureDialog(true); // Open the ESignatureDialog
  };

  const handleSignatureComplete = async (password) => {
    setOpenSignatureDialog(false); // Close the dialog

    if (!password) {
      toast.error("E-Signature is required to proceed.");
      return;
    }

    try {
      // Proceed with the delete action after successful signature
      const response = await deleteTrainingQuestion({ id: pendingQuestionId }).unwrap();
      toast.success("Question Delete successfully!");
      setTimeout(() => {
        navigate("/trainingListing");
      }, 1500);
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Error deleting question. Please try again.");
    }
  };

  // Process fetched data and apply search filter
  const filteredData = (data?.data || [])
    .filter((item) => item.question_text.toLowerCase().includes(searchTerm.toLowerCase()))
    .map((item, index) => ({
      id: item.id,
      serial_number: index + 1,
      question: item.question_text,
      question_type: item.question_type,
      created_at: moment(item.question_created_at).format("DD/MM/YY"), // Adjust the field name
      fullData: item,
    }));

  const columns = [
    { field: "serial_number", headerName: "Sr. No.", flex: 0.5, headerAlign: "center" },
    { field: "question", headerName: "Question", flex: 1, headerAlign: "center" },
    { field: "question_type", headerName: "Question Type", flex: 1, headerAlign: "center" },
    { field: "created_at", headerName: "Created Date", flex: 1, headerAlign: "center" },
    {
      field: "action",
      headerName: "Action",
      flex: 0.5,
      headerAlign: "center",
      renderCell: (params) => (
        <MDBox display="flex" gap={1}>
          <IconButton
            color="primary"
            onClick={() => handleEditQuestion(params.row)} // Pass the question details
          >
            <EditIcon />
          </IconButton>
          {/* <IconButton
            color="error"
            onClick={() => handleDeleteQuestion(params.row.id)} // Pass the question ID
          >
            <DeleteIcon />
          </IconButton> */}
        </MDBox>
      ),
      sortable: false,
      filterable: false,
    },
  ];

  if (isLoading) {
    return <MDTypography variant="h6">Loading...</MDTypography>;
  }

  if (isError) {
    return (
      <MDTypography variant="h6" color="error">
        Failed to fetch data.
      </MDTypography>
    );
  }

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
            Question Listing
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

      {/* E-Signature Dialog */}
      <ESignatureDialog
        open={openSignatureDialog}
        onClose={() => setOpenSignatureDialog(false)}
        onConfirm={handleSignatureComplete} // Pass the handler for signature completion
      />
      {/* <ToastContainer position="top-right" autoClose={3000} /> */}
    </MDBox>
  );
};

export default QuestionListing;
