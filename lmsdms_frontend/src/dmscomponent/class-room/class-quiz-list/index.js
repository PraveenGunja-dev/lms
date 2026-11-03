import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Card from "@mui/material/Card";
import { DataGrid } from "@mui/x-data-grid";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import { useClassroomQuizGetQuery } from "apilms/classtestApi";

const QuestionQuiz = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const classroom = location?.state?.classroom || null;
    const classroom_id = classroom?.classroom_id || null;
  
    // Use the hook to fetch quizzes for the given classroom_id
    const { data: response = {}, isLoading, isError } = useClassroomQuizGetQuery(classroom_id);
  
    // Extract quizzes from the response data
    const quizzes = response.data || [];
  
    const handleSearch = (event) => {
      setSearchTerm(event.target.value);
    };
  
    const handleEditQuiz = (quiz) => {
      navigate("/class-edit-quiz", { state: { quiz,classroom_id } });
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
        quiz_time: `${quiz.quiz_time} mins`,
        pass_criteria: quiz.pass_criteria,
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
              Question Quiz
            </MDTypography>
            <MDButton
              variant="contained"
              color="primary"
              onClick={() => navigate("/class-add-quiz", { state: { classroom_id } })}
              sx={{ ml: 2 }}
            >
              Add Quiz
            </MDButton>
          </MDBox>
          <MDBox display="flex" justifyContent="center" p={2}>
            <div style={{ height: 500, width: "100%" }}>
              {isLoading ? (
                <MDTypography>Loading quizzes...</MDTypography>
              ) : isError ? (
                <MDTypography color="error">Error loading quizzes!</MDTypography>
              ) : (
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
              )}
            </div>
          </MDBox>
        </Card>
      </MDBox>
    );
  };
  
  export default QuestionQuiz;
  