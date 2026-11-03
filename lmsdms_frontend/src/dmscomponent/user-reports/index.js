import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import { DataGrid } from "@mui/x-data-grid";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import { useUserListQuery } from "api/auth/userApi";
import {
  useGetEmployeeTrainingNeedIdentificationQuery,
  useGetEmployeeJobRoleReportQuery,
} from "apilms/reportsApi";
import { toast } from "react-toastify";
import DownloadIcon from "@mui/icons-material/Download";

const UserReports = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTrainingUserId, setSelectedTrainingUserId] = useState(null);
  const [selectedJobRoleUserId, setSelectedJobRoleUserId] = useState(null);
  const { data, error, isLoading } = useUserListQuery();
  const [filteredData, setFilteredData] = useState([]);

  // Fetch Employee Training Need Report only when selectedTrainingUserId is set
  const { data: trainingNeedData, isLoading: trainingNeedLoading } =
    useGetEmployeeTrainingNeedIdentificationQuery(selectedTrainingUserId, {
      skip: !selectedTrainingUserId,
    });

  // Fetch Employee Job Role Report only when selectedJobRoleUserId is set
  const { data: jobRoleData, isLoading: jobRoleLoading } =
    useGetEmployeeJobRoleReportQuery(selectedJobRoleUserId, {
      skip: !selectedJobRoleUserId,
    });

  useEffect(() => {
    if (data?.data) {
      const formattedData = data.data.map((item, index) => ({
        id: item.id,
        serial_number: index + 1,
        full_name: `${item.first_name} ${item.last_name}`,
      }));
      setFilteredData(formattedData);
    }
  }, [data]);

  const handleTrainingNeedReport = (id) => {
    setSelectedTrainingUserId(id);
    // console.log("Debug1")
    // if (trainingNeedLoading) {
    //   toast.info("Loading report...");
    //   return;
    // }
    // console.log("Debug2")
    // if (trainingNeedData.status) {
    //   console.log("Debug 3")
    //   toast.success(trainingNeedData.message || "Report generated successfully!"); 
    //   downloadPDF(trainingNeedData.data, "Employee_Training_Need_Report.pdf");
    // } else {
    //   console.log("Debug 4")
    //   toast.error(trainingNeedData?.message || "Failed to generate training need report.");
    // }
    // console.log("Debug 5")
  };
  useEffect(()=>{
    if (trainingNeedData && trainingNeedData.status) {
      toast.success(trainingNeedData.message || "Report generated successfully!");
      downloadPDF(trainingNeedData.data, "Employee_Training_Need_Report.pdf");
    } else if (trainingNeedData && trainingNeedData?.message) {
      toast.error(trainingNeedData?.message || "Failed to generate training need report.");
    }
  },[trainingNeedData])

  useEffect(()=>{
    if(jobRoleData && jobRoleData.status){
      toast.success(jobRoleData.message || "Report generated successfully.");
      downloadPDF(jobRoleData.data, "Employee_Job_Role_Report.pdf")}  
      else if(jobRoleData && jobRoleData?.message){
        toast.error(jobRoleData?.message || "Failed to generate report")
      }
  },[jobRoleData])
  
  const handleJobRoleReport = (id) => {
    setSelectedJobRoleUserId(id);
  
    // if (jobRoleLoading) {
    //   toast.info("Loading report...");
    //   return;
    // }
  
    // if (jobRoleData?.status) {
    //   toast.success(jobRoleData.message || "Report generated successfully!"); 
    //   downloadPDF(jobRoleData.data, "Employee_Job_Role_Report.pdf");
    // } else {
    //   toast.error(jobRoleData?.message || "Failed to generate job role report.");
    // }
  };
  const downloadPDF = (fileUrl, fileName) => {
    if (!fileUrl) {
      toast.error("File URL is missing.");
      return;
    }
  
    fetch(fileUrl, { method: "HEAD" })
      .then((response) => { 
        if (response.status) {
          const link = document.createElement("a");
          link.href = fileUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success(`${fileName} downloaded successfully!`);
        } else {
          toast.error("Failed to fetch the file. Please try again later.");
        }
      })
      .catch((error) => {
        console.error("Error fetching the file:", error);
        toast.error("Error occurred while downloading the report.");
      });
  };
  
  const filteredDataList = filteredData.filter((user) =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { field: "serial_number", headerName: "Sr. No.", flex: 0.5, headerAlign: "center" },
    { field: "full_name", headerName: "Full Name", flex: 1, headerAlign: "center" },
    {
      field: "training_need",
      headerName: "EMPLOYEE TRAINING NEED IDENTIFICATION",
      flex: 1,
      headerAlign: "center",
      renderCell: (params) => (
        <MDButton
          variant="outlined"
          color="primary"
          size="small"
          onClick={() => handleTrainingNeedReport(params.row.id)}
          startIcon={<DownloadIcon />}
        >
          Employee Training
        </MDButton>
      ),
    },
    {
      field: "job_role_report",
      headerName: "Employee Job Role Report",
      flex: 1,
      headerAlign: "center",
      renderCell: (params) => (
        <MDButton
          variant="outlined"
          color="primary"
          size="small"
          onClick={() => handleJobRoleReport(params.row.id)}
          startIcon={<DownloadIcon />}
        >
          Job Role
        </MDButton>
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
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <MDTypography variant="h4" fontWeight="medium" sx={{ flexGrow: 1, textAlign: "center" }}>
            LMS User Reports
          </MDTypography>
        </MDBox>

        <MDBox display="flex" justifyContent="center" p={2}>
          <div style={{ height: 500, width: "100%" }}>
            <DataGrid
              rows={filteredDataList}
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

export default UserReports;
