import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import Card from "@mui/material/Card";
import { DataGrid } from "@mui/x-data-grid";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import { useGetTrainingQuizzesQuery } from "apilms/quizapi"; // Update with the correct API hook

const QuizListing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  // const { DataQuiz } = location.state || {};
  const {id} = useParams();
  // console.log("DatatattaQuziz",DataQuiz)
  const { data: response, isLoading, isError, refetch } = useGetTrainingQuizzesQuery(id);

  useEffect(() => {
    refetch();
  }, [id]);

  const quizzes = response?.data || [];

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleEditQuiz = (quiz) => {
    navigate("/edit-quiz", { state: { quiz } });
  };

  const filteredData = quizzes
    .filter(
      (quiz) =>
        quiz.quiz_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.quiz_type.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .map((quiz, index) => ({
      ...quiz,
      serial_number: index + 1,
      quiz_time: `${quiz.quiz_time} mins`, // Format quiz time
      pass_criteria: quiz.pass_criteria, // Add pass criteria to the list
    }));

  const columns = [
    { field: "serial_number", headerName: "Sr. No.", flex: 0.5, headerAlign: "center" },
    { field: "quiz_name", headerName: "Quiz Name", flex: 1, headerAlign: "center" },
    { field: "quiz_type", headerName: "Quiz Type", flex: 1, headerAlign: "center" },
    { field: "quiz_time", headerName: "Quiz Time", flex: 1, headerAlign: "center" },
    { field: "pass_criteria", headerName: "Pass Criteria", flex: 1, headerAlign: "center" },
    {
      field: "action",
      headerName: "Action",
      flex: 0.5,
      headerAlign: "center",
      renderCell: (params) => (
        <IconButton color="primary" onClick={() => handleEditQuiz(params.row)}>
          <EditIcon />
        </IconButton>
      ),
    },
  ];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading quizzes.</div>;
  }

  return (
    <MDBox p={3}>
      <Card sx={{ maxWidth: "80%", mx: "auto", mt: 3, marginLeft: "auto", marginRight: 0 }}>
        <MDBox p={3} display="flex" alignItems="center">
          <MDInput
            label="Search"
            variant="outlined"
            size="small"
            sx={{ width: "250px", mr: 2 }}
            value={searchTerm}
            onChange={handleSearch}
          />
          <MDTypography variant="h4" fontWeight="medium" sx={{ flexGrow: 1, textAlign: "center" }}>
            Quiz Listing
          </MDTypography>
          <MDButton
            variant="contained"
            color="primary"
            // onClick={() => navigate("/add-quiz", { state: { DataQuiz } })}
            onClick={() => navigate(`/add-quiz/${id}`)}
            sx={{ ml: 2 }}
          > 
            Add Quiz
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
                },
              }}
            />
          </div>
        </MDBox>
      </Card>
    </MDBox>
  );
};

export default QuizListing;
