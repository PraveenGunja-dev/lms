import React, { useState } from "react";
import PropTypes from "prop-types";
import { Box, Typography, List, ListItem, ListItemText, TextField } from "@mui/material";
import { useViewCommentsQuery } from "api/auth/commentsApi";
import MDButton from "components/MDButton";
import MDBox from "components/MDBox";

const CommentDrawer = ({ onEditCommentClick, handleSaveEdit, documentId }) => {
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  // Fetch comments filtered by documentId
  const { data, isLoading, isError } = useViewCommentsQuery(documentId);
  // console.log("Document id:", documentId);

  const startEditing = (id, currentText) => {
    setEditingId(id);
    setEditText(currentText);
  };

  const saveEdit = () => {
    handleSaveEdit(editingId, editText);
    setEditingId(null);
    setEditText("");
  };

  // Parse comments from the API response
  const comments = data?.data || [];
  // console.log("Fetched Comments:", data);

  return (
    <Box
      sx={{
        width: 300,
        padding: 2,
        position: "fixed",
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: "#f5f5f5",
        boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.2)",
        overflowY: "auto",
      }}
    >
      <Typography variant="h6" gutterBottom>
        All Comments
      </Typography>
      {isLoading ? (
        <Typography variant="body2">Loading comments...</Typography>
      ) : isError ? (
        <Typography variant="body2" color="error">
          Failed to load comments.
        </Typography>
      ) : (
        <List>
          {comments.map(({ id, user_first_name, selected_word, Comment_description }) => (
            <ListItem
              key={id}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                borderBottom: "1px solid #ddd",
                paddingBottom: 2,
                marginBottom: 2,
              }}
            >
              {editingId === id ? (
                <>
                  <TextField
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    fullWidth
                    margin="normal"
                    sx={{ mb: 2 }}
                  />
                  <MDBox>
                    <MDButton onClick={saveEdit} variant="gradient" color="submit" size="small" sx={{ mr: 1 }}>
                      Save
                    </MDButton>
                    <MDButton onClick={() => setEditingId(null)} variant="gradient" color="error" size="small">
                      Cancel
                    </MDButton>
                  </MDBox>
                </>
              ) : (
                <>
                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: "bold", mb: 1 }}>
                    {user_first_name ? user_first_name : "Anonymous"} commented on Document {selected_word ? `"${selected_word}"` : "an unknown text"}
                  </Typography>
                  <ListItemText primary={Comment_description} sx={{ mb: 1 }} />
                  <MDButton
                    variant="gradient"
                    color="submit"
                    size="small"
                    onClick={() => startEditing(id, Comment_description)}
                    sx={{ mt: 1 }}
                  >
                    Edit
                  </MDButton>
                </>
              )}
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

CommentDrawer.propTypes = {
  onEditCommentClick: PropTypes.func.isRequired,
  handleSaveEdit: PropTypes.func.isRequired,
  documentId: PropTypes.string.isRequired, // Ensure documentId is passed
};

export default CommentDrawer;
