import React from "react";
import PropTypes from "prop-types";
import { Box, Button, TextField, Typography, Dialog, DialogContent } from "@mui/material";
import MDButton from "components/MDButton";

const CommentModal = ({
  open,
  onClose,
  currentComment,
  setCurrentComment,
  handleSaveComment,
}) => {
  const handleSave = () => {
    handleSaveComment();
    onClose(); // Close the modal after saving
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent>
        <Box sx={{ padding: 2, position: "relative", height: "100%" }}>
          <Typography variant="h6">Add Comment</Typography>
          <TextField
            value={currentComment}
            onChange={(e) => setCurrentComment(e.target.value)}
            rows={4}
            multiline
            fullWidth
            variant="outlined"
            margin="normal"
          />
          <MDButton
            variant="gradient"
            color="submit"
            onClick={handleSave} 
            sx={{ marginBottom: 2, backgroundColor: "#E53471", color: "white" }}
          >
            Save Comment
          </MDButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

CommentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentComment: PropTypes.string.isRequired,
  setCurrentComment: PropTypes.func.isRequired,
  handleSaveComment: PropTypes.func.isRequired,
};

export default CommentModal;
