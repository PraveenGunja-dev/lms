// AddMaterial.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, MenuItem, TextField, IconButton, List, ListItem, ListItemText } from "@mui/material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import BasicLayout from "layouts/authentication/components/BasicLayout";
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import ESignatureDialog from "layouts/authentication/ESignatureDialog";
import DeleteIcon from "@mui/icons-material/Delete";

function AddMaterial() {
  const [sections, setSections] = useState([]);
  const [sectionName, setSectionName] = useState("");
  const [sectionOrder, setSectionOrder] = useState("");
  const [sectionDescription, setSectionDescription] = useState("");
  const [sectionStatus, setSectionStatus] = useState("Active");
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);

  const [files, setFiles] = useState([]);
  const [fileType, setFileType] = useState("");
  const [fileName, setFileName] = useState("");
  const [minReadingTime, setMinReadingTime] = useState("");

  const navigate = useNavigate();

  const handleAddSection = () => {
    const newSection = {
      name: sectionName,
      order: sectionOrder,
      description: sectionDescription,
      status: sectionStatus,
      files: [],
    };
    setSections([...sections, newSection]);
    // Reset section fields
    setSectionName("");
    setSectionOrder("");
    setSectionDescription("");
    setSectionStatus("Active");
  };

  const handleAddFile = (index) => {
    const newFile = {
      type: fileType,
      name: fileName,
      minReadingTime: minReadingTime,
      file: null, // This will hold the file object
    };

    const updatedSections = [...sections];
    updatedSections[index].files.push(newFile);
    setSections(updatedSections);
    // Reset file fields
    setFileType("");
    setFileName("");
    setMinReadingTime("");
  };

  const handleFileChange = (index, event) => {
    const updatedSections = [...sections];
    updatedSections[index].files[updatedSections[index].files.length - 1].file =
      event.target.files[0];
    setSections(updatedSections);
  };

  const handleRemoveFile = (sectionIndex, fileIndex) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].files.splice(fileIndex, 1);
    setSections(updatedSections);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setOpenSignatureDialog(true);
    console.log("Material Details Submitted:", sections);
  };

  const handleClear = () => {
    setSections([]);
    setSectionName("");
    setSectionOrder("");
    setSectionDescription("");
    setSectionStatus("Active");
  };

  const handleCloseSignatureDialog = () => {
    setOpenSignatureDialog(false);
    navigate("/dashboard");
  };

  return (
    <BasicLayout image={bgImage} showNavbarFooter={false}>
      <Card sx={{ width: 600, mx: "auto" }}>
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
            Add Material
          </MDTypography>
        </MDBox>
        <MDBox mt={2} mb={1} display="flex" justifyContent="flex-end">
          <MDButton
            variant="outlined"
            color="error"
            size="small"
            onClick={handleClear}
            sx={{ marginLeft: "10px", marginRight: "10px" }}
          >
            Clear
          </MDButton>
        </MDBox>

        <MDBox pb={3} px={3}>
          <MDBox component="form" role="form" onSubmit={handleSubmit} sx={{ padding: 3 }}>
            <MDBox mb={3}>
              <MDInput
                type="text"
                label="Section Name"
                fullWidth
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
              />
            </MDBox>
            <MDBox mb={3}>
              <MDInput
                type="number"
                label="Section Order"
                fullWidth
                value={sectionOrder}
                onChange={(e) => setSectionOrder(e.target.value)}
              />
            </MDBox>
            <MDBox mb={3}>
              <MDInput
                type="text"
                label="Description"
                fullWidth
                value={sectionDescription}
                onChange={(e) => setSectionDescription(e.target.value)}
              />
            </MDBox>
            <MDBox mb={3}>
              <TextField
                select
                label="Status"
                fullWidth
                value={sectionStatus}
                onChange={(e) => setSectionStatus(e.target.value)}
                sx={{
                  height: "40px", // Set desired height here
                  "& .MuiInputBase-root": {
                    minHeight: "2.4265em",
                    height: "100%", // Ensures the inner select aligns with the specified height
                  },
                }}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </TextField>
            </MDBox>
            <MDBox mb={3}>
              <MDButton variant="gradient" color="success" onClick={handleAddSection}>
                Add Section
              </MDButton>
            </MDBox>
          </MDBox>

          <MDBox>
            {sections.map((section, sectionIndex) => (
              <MDBox key={sectionIndex} sx={{ mb: 3, border: "1px solid #ccc", padding: 2 }}>
                <MDTypography variant="h6" fontWeight="medium">
                  {section.name}
                </MDTypography>
                <MDTypography variant="body2">{section.description}</MDTypography>
                <List>
                  {section.files.map((file, fileIndex) => (
                    <ListItem
                      key={fileIndex}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleRemoveFile(sectionIndex, fileIndex)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText primary={file.name ? file.name : "No file uploaded"} />
                    </ListItem>
                  ))}
                </List>
                <MDBox mb={3}>
                  <TextField
                    select
                    label="File Type"
                    fullWidth
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    sx={{
                      height: "40px", // Set desired height here
                      "& .MuiInputBase-root": {
                        minHeight: "2.4265em",
                        height: "100%", // Ensures the inner select aligns with the specified height
                      },
                    }}
                  >
                    <MenuItem value="PDF">PDF</MenuItem>
                    <MenuItem value="Image">Image</MenuItem>
                    <MenuItem value="Audio">Audio</MenuItem>
                    <MenuItem value="Video">Video</MenuItem>
                    {/* <MenuItem value="Import">Import</MenuItem> */}
                  </TextField>
                </MDBox>
                <MDBox mb={3}>
                  <MDInput
                    type="text"
                    label="File Name"
                    fullWidth
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                  />
                </MDBox>
                <MDBox mb={3}>
                  <MDInput
                    type="text"
                    label="Minimum Reading Time (minutes)"
                    fullWidth
                    value={minReadingTime}
                    onChange={(e) => setMinReadingTime(e.target.value)}
                  />
                </MDBox>
                <MDBox mb={3}>
                  <MDInput
                    type="file"
                    label="Select File"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    onChange={(e) => handleFileChange(sectionIndex, e)}
                  />
                </MDBox>
                <MDButton
                  variant="gradient"
                  color="submit"
                  onClick={() => handleAddFile(sectionIndex)}
                >
                  Add File
                </MDButton>
              </MDBox>
            ))}
          </MDBox>

          <MDBox mt={2} mb={1}>
            <MDButton variant="gradient" color="submit" fullWidth type="submit">
              Submit
            </MDButton>
          </MDBox>
        </MDBox>
      </Card>

      {/* E-Signature Dialog */}
      <ESignatureDialog open={openSignatureDialog} handleClose={handleCloseSignatureDialog} />
    </BasicLayout>
  );
}

export default AddMaterial;
