import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import MDButton from 'components/MDButton';
import MDBox from 'components/MDBox';
import MDTypography from 'components/MDTypography';
import { useFetchParentDocumentsQuery } from 'api/auth/documentApi';

function EffectiveDialog({ openDialog, selectedRow, handleCloseDialog, handleConfirmEffective }) {
  // Fetch child documents if this is a parent document
  const { 
    data: childDocuments, 
    isLoading, 
    isError, 
    error 
  } = useFetchParentDocumentsQuery(
    selectedRow?.id, 
    { skip: !selectedRow?.is_parent || !openDialog || !selectedRow?.id }
  );
  // console.log("++++++++",childDocuments)
  // Check if all child documents are effective
  const allChildrenEffective = useMemo(() => {
    if (!childDocuments || !Array.isArray(childDocuments) || childDocuments.length === 0) {
      return true; // If no children, allow effective
    }
    
    return childDocuments.every(doc => doc.document_current_status === 7 || doc.document_current_status === 12);
  }, [childDocuments]);

  // Combined check for button disabled state
  const canConfirm = !selectedRow?.is_parent || (selectedRow?.is_parent && allChildrenEffective);

  return (
    <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
      <DialogTitle>Confirm Effective Action</DialogTitle>
      <DialogContent>
        {selectedRow && (
          <MDBox>
            <MDTypography variant="body1" color="#344767">
              Training is completed. Are you sure you want to mark the document{" "}
              <strong>{selectedRow.document_title}</strong> as effective?
            </MDTypography>
            
            {/* Display child documents if this is a parent */}
            {selectedRow.is_parent && (
              <MDBox sx={{ marginTop: 2 }}>
                <MDTypography variant="h6" color="#344767">
                  Child Documents:
                </MDTypography>
                
                {isLoading ? (
                  <MDTypography variant="body2">Loading child documents...</MDTypography>
                ) : isError ? (
                  <MDTypography variant="body2" color="error">
                    Error loading child documents: {error?.message || "Unknown error"}
                  </MDTypography>
                ) : childDocuments && Array.isArray(childDocuments) ? (
                  childDocuments.length > 0 ? (
                    <MDBox sx={{ maxHeight: "200px", overflowY: "auto", mt: 1 }}>
                      {childDocuments.map((doc) => (
                        <MDBox 
                          key={doc.id} 
                          sx={{ 
                            display: "flex", 
                            justifyContent: "space-between", 
                            p: 1, 
                            borderBottom: "1px solid #eee" 
                          }}
                        >
                          <MDTypography variant="body2">{doc.document_title}</MDTypography>
                          <MDTypography 
                            variant="body2"
                            color={doc.status === "Effective" ? "success" : "warning"}
                            fontWeight="medium"
                          >
                            Status: {doc.status}
                          </MDTypography>
                        </MDBox>
                      ))}
                    </MDBox>
                  ) : (
                    <MDTypography variant="body2">No child documents found.</MDTypography>
                  )
                ) : (
                  <MDTypography variant="body2" color="error">
                    Invalid response format for child documents.
                  </MDTypography>
                )}
                
                {selectedRow.is_parent && !allChildrenEffective && childDocuments && Array.isArray(childDocuments) && childDocuments.length > 0 && (
                  <MDBox sx={{ mt: 2 }}>
                    <MDTypography variant="body2" color="error">
                      All child documents must be Effective or Obsolete before making this document effective.
                    </MDTypography>
                  </MDBox>
                )}
              </MDBox>
            )}
          </MDBox>
        )}
      </DialogContent>
      <DialogActions>
        <MDButton onClick={handleCloseDialog} color="error">
          Cancel
        </MDButton>
        <MDButton 
          onClick={handleConfirmEffective} 
          color="primary"
          disabled={!canConfirm}
        >
          Confirm
        </MDButton>
      </DialogActions>
    </Dialog>
  );
}

// PropTypes validation
EffectiveDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  selectedRow: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    document_title: PropTypes.string.isRequired,
    is_parent: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.oneOf([null, undefined])
    ])
  }),
  handleCloseDialog: PropTypes.func.isRequired,
  handleConfirmEffective: PropTypes.func.isRequired,
};

export default EffectiveDialog;