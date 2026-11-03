import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Dialog, DialogActions, DialogContent } from "@mui/material";
import MDButton from "components/MDButton";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { useDocumentreleaseEffectiveStatusMutation } from "api/auth/texteditorApi";
import { useFetchDocumentsQuery } from "api/auth/documentApi";
import { useFetchParentDocumentsQuery } from "api/auth/documentApi";
import { toast } from "react-toastify";
import { useGetIdWiseDocumentListQuery } from "api/auth/texteditorApi";

const ConditionalDialog = ({
  open,
  onClose,
  onConfirm,
  trainingStatus,
  documentId,
  revisionMonth, 
  isParent, 
  parentId
}) => {
  // Destructure the mutation hook
  const [documentReleaseEffectiveStatus] = useDocumentreleaseEffectiveStatusMutation();
  const { refetch } = useFetchDocumentsQuery();
  // console.log("Parent IDDD", parentId);

  // Fetch parent document data if parentId exists
  const { 
    data: parentDocumentData, 
    isLoading: isLoadingParent, 
    isError: isParentError 
  } = useGetIdWiseDocumentListQuery(
    parentId, 
    { skip: !parentId || !open }
  );
  // console.log(">>>>>>>>>",parentDocumentData)
  // Determine if the parent document allows release (current_status_name is "Release" or has effective_date)
  const canReleaseFromParent = React.useMemo(() => {
    if (!parentId || !parentDocumentData || !Array.isArray(parentDocumentData) || parentDocumentData.length === 0) {
      return true; // If no parent, allow release
    }
    
    const parentDoc = parentDocumentData[0];
    // console.log(parentDoc)
    return parentDoc.document_current_status === 6 || parentDoc.effective_date !== null;
  }, [parentId, parentDocumentData]);

  // Fetch child documents if this is a parent document
  const { 
    data: childDocuments, 
    isLoading, 
    isError, 
    error 
  } = useFetchParentDocumentsQuery(
    documentId, 
    { skip: !isParent || !open || !documentId }
  );
  // console.log(">>>>>",childDocuments)
  // Check if all child documents are approved 
  const allChildrenApproved = React.useMemo(() => {
    if (!childDocuments || !Array.isArray(childDocuments) || childDocuments.length === 0) {
      return false;
    }
    
    // return childDocuments.every(doc => doc.status === "Approve");
    return childDocuments.every(doc => 
      // doc.status === "Approve" || 
      // doc.status === "Approved" || 
      // doc.status === "Effective" || 
      // doc.status === "Release" ||
      // doc.status === "Obsolete"  
      doc.document_current_status == 7 || 
      doc.document_current_status == 6 ||
      doc.document_current_status == 12  
    );
  }, [childDocuments]);

  const heading =
    trainingStatus === true
      ? "Are you sure you want to release the document?"
      : "Are you sure you want to effective the document?";
  const finalMsg=
  trainingStatus === true
  ? "All child documents must be Released before making this document released."
  : "All child documents must be effective before making this document effective.";
  trainingStatus ===true
  const handleConfirm = async () => {
    const status = trainingStatus === true ? 6 : 7; 
    const currentDate = new Date();
    const effectiveDate = `${currentDate.getDate().toString().padStart(2, "0")}-${(
      currentDate.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${currentDate.getFullYear()}`;

    let revisionDate = ""; 
    if (revisionMonth && revisionMonth !== "0") {
      const [day, month, year] = effectiveDate.split("-").map(Number);
      const effectiveDateObj = new Date(year, month - 1, day);
      const revisionYear = effectiveDateObj.getFullYear() + 1;
      const revisionDateObj = new Date(revisionYear, parseInt(revisionMonth, 10) - 1, day);
      if (revisionDateObj.getMonth() !== parseInt(revisionMonth, 10) - 1) {
        revisionDateObj.setDate(0); 
      }
      revisionDate = `${revisionDateObj.getDate().toString().padStart(2, "0")}-${(
        revisionDateObj.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${revisionDateObj.getFullYear()}`;
    }
    try {
      await documentReleaseEffectiveStatus({
        document_id: documentId,
        status_id: status,
        ...(status === 7 && { effective_date: effectiveDate }),
        ...(status === 7 && effectiveDate && { revision_date: revisionDate }),
      });
      refetch();
      toast.success("Document release successful!"); 
    } catch (error) {
      console.error("Error submitting the document release:", error);
      toast.error("Failed to release document. Please try again.");
    }
    onClose(); 
  };

  // Combined check for button disabled state
  const canSubmit = (!isParent || (isParent && allChildrenApproved));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth> 
      <MDBox sx={{ textAlign: "center" }}>
        <MDTypography variant="h4" fontWeight="medium" color="#344767" mt={1}>
          {heading}
        </MDTypography>
      </MDBox>

      <form onSubmit={(e) => e.preventDefault()}>
        <DialogContent>
          <MDBox sx={{ marginTop: 2, textAlign: "center" }}>
            <MDTypography variant="body1" color="#344767">
              Please confirm your action.
            </MDTypography>
          </MDBox>
          
          {/* Display parent document status if applicable */}
          {parentId && (
            <MDBox sx={{ marginTop: 2 }}>
              <MDTypography variant="h6" color="#344767">
                Parent Document Status:
              </MDTypography>
              
              {isLoadingParent ? (
                <MDTypography variant="body2">Loading parent document...</MDTypography>
              ) : isParentError ? (
                <MDTypography variant="body2" color="error">
                  Error loading parent document
                </MDTypography>
              ) : parentDocumentData && Array.isArray(parentDocumentData) && parentDocumentData.length > 0 ? (
                <MDBox sx={{ p: 1, borderBottom: "1px solid #eee" }}>
                  <MDTypography variant="body2">
                    {parentDocumentData[0].document_title}
                  </MDTypography>
                  <MDTypography 
                    variant="body2"
                    color={canReleaseFromParent ? "success" : "error"}
                    fontWeight="medium"
                  >
                    Status: {parentDocumentData[0].current_status_name}
                  </MDTypography>
                  {/* {!canReleaseFromParent && (
                    <MDTypography variant="body2" color="error" mt={1}>
                      Parent document must be Released or Effective before releasing this document.
                    </MDTypography>
                  )} */}
                </MDBox>
              ) : (
                <MDTypography variant="body2">No parent document found.</MDTypography>
              )}
            </MDBox>
          )}
          
          {/* Display child documents if this is a parent */}
          {isParent && (
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
                          color={doc.status === "Approve" ? "success" : "warning"}
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
              
              {isParent && !allChildrenApproved && childDocuments && Array.isArray(childDocuments) && childDocuments.length > 0 && (
                <MDBox sx={{ mt: 2 }}>
                  <MDTypography variant="body2" color="error">
                    {/* All child documents must be Released before making this document effective. */}
                    {finalMsg}
                  </MDTypography>
                </MDBox>
              )}
            </MDBox>
          )}
        </DialogContent>

        <DialogActions>
          <MDButton onClick={onClose} color="error" sx={{ marginRight: "10px" }}>
            Cancel
          </MDButton>
          <MDBox>
            <MDButton
              variant="gradient"
              color="submit"
              fullWidth
              onClick={handleConfirm}
              disabled={!canSubmit}
            >
              Submit
            </MDButton>
          </MDBox>
        </DialogActions>
      </form>
    </Dialog>
  );
};

ConditionalDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  trainingStatus: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]).isRequired,
  documentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  revisionMonth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isParent: PropTypes.bool,
  parentId: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.null])
};

ConditionalDialog.defaultProps = {
  isParent: false,
  revisionMonth: "0"
};

export default ConditionalDialog;