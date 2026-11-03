import React, { useMemo } from "react";
import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useFetchParentDocumentsQuery } from "api/auth/documentApi";

const ObsoleteDialog = ({ open, onClose, onConfirm, selectedRow }) => {
  const {
    data: childDocuments,
    isLoading,
    isError,
    error,
  } = useFetchParentDocumentsQuery(selectedRow?.id, {
    skip: !selectedRow?.is_parent || !open || !selectedRow?.id,
  });
  console.log("SELECTED ROW",selectedRow)
  // Check if all child documents are obsolete
  const allChildrenObsolete = useMemo(() => {
    if (!childDocuments || !Array.isArray(childDocuments) || childDocuments.length === 0) {
      return true; // No children, allow obsoleting
    }
    // return childDocuments.every((doc) => doc.document_current_status == "Obsolete" || 'Supersede');
    return childDocuments.every(
      (doc) => doc.document_current_status === 12 || doc.document_current_status === 15
    );
  }, [childDocuments]);

  const canObsolete = !selectedRow?.is_parent || (selectedRow?.is_parent && allChildrenObsolete);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Obsolete Document</DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          Are you sure you want to mark <strong>{selectedRow?.document_title}</strong> as obsolete?
        </Typography>

        {/* Display child documents if this is a parent */}
        {selectedRow?.is_parent && (
          <div style={{ marginTop: 16 }}>
            <Typography variant="h6">Child Documents:</Typography>

            {isLoading ? (
              <Typography variant="body2">Loading child documents...</Typography>
            ) : isError ? (
              <Typography variant="body2" color="error">
                Error loading child documents: {error?.message || "Unknown error"}
              </Typography>
            ) : childDocuments && Array.isArray(childDocuments) ? (
              childDocuments.length > 0 ? (
                <div style={{ maxHeight: 200, overflowY: "auto", marginTop: 8 }}>
                  {childDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: 8,
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <Typography variant="body2">{doc.document_title}</Typography>
                      <Typography
                        variant="body2"
                        color={doc.status === "Obsolete" ? "success" : "warning"}
                      >
                        Status: {doc.status}
                      </Typography>
                    </div>
                  ))}
                </div>
              ) : (
                <Typography variant="body2">No child documents found.</Typography>
              )
            ) : (
              <Typography variant="body2" color="error">
                Invalid response format for child documents.
              </Typography>
            )}

            {selectedRow?.is_parent && !allChildrenObsolete && (
              <Typography variant="body2" color="error" style={{ marginTop: 16 }}>
                All child documents must be Obsolete before making this document obsolete.
              </Typography>
            )}
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={() => onConfirm(selectedRow?.id)} color="secondary" disabled={!canObsolete}>
          Obsolete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// PropTypes validation
ObsoleteDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  selectedRow: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    document_title: PropTypes.string.isRequired,
    is_parent: PropTypes.oneOfType([PropTypes.bool, PropTypes.oneOf([null, undefined])]),
  }),
};

export default ObsoleteDialog;
