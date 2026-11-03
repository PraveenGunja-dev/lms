import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle, Paper } from "@mui/material";
import PropTypes from "prop-types"; // Import PropTypes
import { Editor } from "@tinymce/tinymce-react"; // Import TinyMCE Editor component
import MDButton from "components/MDButton";

// Toolbar options for TinyMCE editor
const toolbarOptions = [
  "undo redo | formatselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist | outdent indent | link image | removeformat",
];

function TinyMCEEditorDialog({ open, onClose, title, content, onSave }) {
  const [editorContent, setEditorContent] = useState(content);
  const editorRef = useRef(null);

  useEffect(() => {
    if (open) {
      setEditorContent(content); // Update editor content when dialog is opened
    }
  }, [open, content]);

  const handleSave = () => {
    if (editorRef.current) {
      const plainTextContent = editorContent.replace(/<[^>]*>/g, ''); // Strip HTML tags to get plain text
    
      onSave(plainTextContent); // Save the plain text content

    }
    onClose(); // Close the dialog after saving
  };

  const handleCancel = () => {
    onClose(); // Close the dialog when 'Cancel' is clicked
  };

  return (
    <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="md">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ padding: 3 }}>
        <Paper
          sx={{
            padding: 2,
            borderRadius: 2,
            boxShadow: 3,
            height: 300,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
          }}
        >
          <Editor
            apiKey="jlpd750dl6qw9w9csv2i49h7v3qs4vm3ywq3qyecjwe2ktpw" // Add your TinyMCE API key here
            value={editorContent}
            onEditorChange={(newValue) => setEditorContent(newValue)} // Handle content changes
            init={{
              height: 250,
              menubar: false,
              toolbar: toolbarOptions.join(" "), // Use the toolbar options defined above
              plugins: "link image lists",
              entity_encoding: "raw"
               // Enable necessary plugins
            }}
            ref={editorRef} // Assign the editorRef to TinyMCE
          />
        </Paper>
      </DialogContent>
      <DialogActions sx={{ padding: 2 }}>
        <MDButton onClick={handleSave} color="submit" variant="gradient">
          Save
        </MDButton>
        <MDButton onClick={handleCancel} color="error" variant="gradient">
          Cancel
        </MDButton>
      </DialogActions>
    </Dialog>
  );
}

// Add PropTypes validation for the props
TinyMCEEditorDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  content: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default TinyMCEEditorDialog;
