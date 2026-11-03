import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Collapse,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import MDButton from "components/MDButton";
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Edit,
  Delete,
  Add,
  Visibility,
} from "@mui/icons-material";
import EditSectionModal from "./editSectionModal";
import EditMaterialModal from "./editMaterialModal";
import ViewFileModal from "./ViewFileModal";
import CollapsibleSection from "./materialCards";
import apiService from "services/apiService";

const CollapsibleCard = ({ data, open, setOpen }) => {
  const [openRows, setOpenRows] = useState({}); 
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editSectionData, setEditSectionData] = useState(null);
  const [openEditMaterialModal, setOpenEditMaterialModal] = useState(false);
  const [editMaterialData, setEditMaterialData] = useState(null);
  const [openViewFileModal, setOpenViewFileModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [sectionList, setSectionList] = useState([]);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState(null);

  useEffect(() => { 
    setSectionList(data)
  }, [data])

  const toggleRow = (id) => {
    setOpenRows((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  const handleOpenEditModal = (section) => {
    setEditSectionData(section);
    setOpenEditModal(true);
  };

  const handleCloseEditModal = () => {
    setOpenEditModal(false);
    setEditSectionData(null);
  };

  const handleOpenEditMaterialModal = (material) => {
    setEditMaterialData(material);
    setOpenEditMaterialModal(true);
  };

  const handleCloseEditMaterialModal = () => {
    setOpenEditMaterialModal(false);
    setEditMaterialData(null);
  };

  const handleCloseViewFileModal = () => {
    setOpenViewFileModal(false);
    setSelectedMaterial(null);
  };

  const handleEditSubmit = (updatedSection) => {
    console.log("Updated Section:", updatedSection);
    setOpenEditModal(false);
  };

  const handleEditMaterialSubmit = (updatedMaterial) => {
    console.log("Updated Material:", updatedMaterial);
    setOpenEditMaterialModal(false);
  };

  const handleViewFileClick = (material) => {
    setSelectedMaterial(material);
    setOpenViewFileModal(true);
  };

  const openDeleteConfirmation = (trainingMaterialId) => {
    setSectionToDelete(trainingMaterialId);
    setDeleteConfirmationOpen(true);
  };

  const handleCloseDeleteConfirmation = () => {
    setDeleteConfirmationOpen(false);
    setSectionToDelete(null);
  };

  const deleteSection = async () => {
    if (!sectionToDelete) return;

    try {
      const response = await apiService.delete(`/lms_module/update_training_section/${sectionToDelete}`);
      console.log('Section deleted successfully:', response.data);
      
      // Remove the section from the list immediately
      setSectionList((prevData) => 
        prevData.filter((section) => section.id !== sectionToDelete)
      );

      // Close the confirmation dialog
      handleCloseDeleteConfirmation();
    } catch (error) {
      console.error('Error deleting Section:', error);
      // Optionally, show an error message to the user
    }
  };

  return (
    <Box sx={{ padding: 5 }}>
      <Grid container spacing={3}>
        {Array.isArray(sectionList) && sectionList.length > 0 ? (
          sectionList.map((row) => (
            <Grid item xs={12} key={row.id}>
              <Card
                sx={{
                  boxShadow: 8,
                  borderRadius: 2,
                  background: "linear-gradient(to right, #f9f9f9, #e8e8e8)",
                  paddingTop: 3,
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "scale(1.02)",
                  },
                }}
                elevation={10}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: "bold" }}>
                        Section: {row.section_name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "gray", fontSize: 14 }}
                      >
                        {row.section_description}
                      </Typography>
                    </Box>
                    <Box>
                      <MDButton
                        startIcon={<Edit />}
                        sx={{ marginLeft: 1, color: "#1976d2" }}
                        onClick={() => handleOpenEditModal(row)}
                      >
                        Edit Section
                      </MDButton>
                      <Button
                        startIcon={<Delete />}
                        onClick={() => openDeleteConfirmation(row.id)}
                        sx={{
                          marginLeft: 1,
                          color: "#d32f2f",
                          "&:hover": {
                            color: "red !important",
                          },
                        }}
                      >
                        Delete Section
                      </Button>
                    </Box>
                    <IconButton onClick={() => toggleRow(row.id)}>
                      {openRows[row.id] ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                  </Box>
                </CardContent>
                <CollapsibleSection
                  open={openRows[row.id]}
                  materials={row.material}
                  handleViewFileClick={handleViewFileClick}
                  handleOpenEditMaterialModal={handleOpenEditMaterialModal}
                  sectionID={row.id}
                />
              </Card>
            </Grid>
          ))
        ) : (
          <Typography variant="h6" color="error" sx={{ textAlign: 'center', width: '100%' }}>
            Section not found.
          </Typography>
        )}
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmationOpen}
        onClose={handleCloseDeleteConfirmation}
        aria-labelledby="delete-section-dialog-title"
        aria-describedby="delete-section-dialog-description"
      >
        <DialogTitle id="delete-section-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-section-dialog-description">
            Are you sure you want to delete this section? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirmation} color="primary">
            Cancel
          </Button>
          <Button onClick={deleteSection} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Other existing modals... */}
      {selectedMaterial && (
        <ViewFileModal
          open={openViewFileModal}
          handleClose={handleCloseViewFileModal}
          material={selectedMaterial}
        />
      )}

      {editSectionData && (
        <EditSectionModal
          open={openEditModal}
          handleClose={handleCloseEditModal}
          sectionData={editSectionData}
          handleSubmit={handleEditSubmit}
        />
      )}

      {editMaterialData && (
        <EditMaterialModal
          open={openEditMaterialModal}
          handleClose={handleCloseEditMaterialModal}
          materialData={editMaterialData}
          handleSubmit={handleEditMaterialSubmit}
        />
      )}
    </Box>
  );
};

CollapsibleCard.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      training: PropTypes.number.isRequired,
      training_name: PropTypes.string.isRequired,
      section_name: PropTypes.string.isRequired,
      section_description: PropTypes.string.isRequired,
      section_order: PropTypes.string.isRequired,
    })
  ).isRequired,
  open: PropTypes.bool,
  setOpen: PropTypes.func,  
};

export default CollapsibleCard;