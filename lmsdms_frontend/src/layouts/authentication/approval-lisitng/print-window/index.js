import React, { useState } from "react";
import PropTypes from "prop-types";
import { Dialog, DialogContent, DialogActions, CircularProgress } from "@mui/material";
import MDButton from "components/MDButton";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { usePrintConvertPdfMutation } from "api/auth/printApi";
import { getErrorMessage } from "services/baseQuery";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * Controlled printing: every click on "Print" asks the server for ONE copy.
 * The server checks the approved copy limit, stamps the next approval (copy)
 * number on the PDF and counts the copy, so the limit cannot be bypassed by
 * reopening the dialog or refreshing the page.
 */
const PrintDocumentDialog = ({ open, onClose, id, printRequestId, noOfRequestByAdmin, print_count }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [printCount, setPrintCount] = useState(print_count || 0);
  const [allowed, setAllowed] = useState(noOfRequestByAdmin || 0);
  const [lastCopyNumber, setLastCopyNumber] = useState("");
  const [printConvertPdf] = usePrintConvertPdfMutation();
  const limitReached = printCount >= allowed;

  const openForPrinting = (pdfLink) => {
    const printWindow = window.open(pdfLink, "_blank");
    if (printWindow) {
      printWindow.addEventListener("load", () => {
        try {
          printWindow.print();
        } catch (printError) {
          printInHiddenFrame(pdfLink);
        }
      });
    } else {
      toast.warning("Popup blocked! Printing through the page instead.");
      printInHiddenFrame(pdfLink);
    }
  };

  const printInHiddenFrame = (pdfLink) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.top = "-9999px";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.src = pdfLink;
    iframe.onload = () => {
      try {
        iframe.contentWindow.print();
      } catch (error) {
        toast.error("Unable to print document. Please check browser settings.");
      }
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
    document.body.appendChild(iframe);
  };

  const handlePrint = async () => {
    if (limitReached) {
      toast.warning("Print limit reached. Please raise a new print request.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await printConvertPdf({
        sop_document_id: id,
        print_request_id: printRequestId,
      }).unwrap();
      setPrintCount(response.print_count);
      setAllowed(response.allowed);
      setLastCopyNumber(response.approval_number || "");
      if (!response.pdf_link) {
        toast.error("Failed to retrieve the print copy.");
        return;
      }
      openForPrinting(response.pdf_link);
      toast.success(
        `Copy ${response.print_count} of ${response.allowed}${
          response.approval_number ? ` (${response.approval_number})` : ""
        } is ready to print.`
      );
    } catch (error) {
      if (error?.data?.print_count !== undefined) {
        setPrintCount(error.data.print_count);
        setAllowed(error.data.allowed);
      }
      toast.error(getErrorMessage(error, "Error preparing the print copy."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <MDBox sx={{ textAlign: "center", padding: 2, backgroundColor: "#f5f5f5" }}>
        <MDTypography variant="h4" fontWeight="medium" color="#344767">
          Print Document
        </MDTypography>
      </MDBox>
      <DialogContent sx={{ padding: "20px", backgroundColor: "#fafafa" }}>
        {isLoading ? (
          <MDBox sx={{ display: "flex", justifyContent: "center", padding: 2 }}>
            <CircularProgress />
          </MDBox>
        ) : limitReached ? (
          <MDTypography color="error">
            All approved copies have been printed. For more prints, raise a new print request.
          </MDTypography>
        ) : (
          <MDTypography>
            {printCount} of {allowed} approved copies printed. Each click on Print issues one
            numbered copy.
            {lastCopyNumber ? ` Last copy: ${lastCopyNumber}.` : ""}
          </MDTypography>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", paddingBottom: 2 }}>
        <MDButton onClick={onClose} color="error" sx={{ textTransform: "capitalize" }}>
          Close
        </MDButton>
        <MDButton
          variant="gradient"
          color="success"
          disabled={isLoading || limitReached}
          onClick={handlePrint}
          sx={{ backgroundColor: "#4caf50", ":hover": { backgroundColor: "#388e3c" } }}
        >
          Print Document ({printCount}/{allowed})
        </MDButton>
      </DialogActions>
    </Dialog>
  );
};

PrintDocumentDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  printRequestId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  noOfRequestByAdmin: PropTypes.number,
  print_count: PropTypes.number,
};

PrintDocumentDialog.defaultProps = {
  printRequestId: null,
  noOfRequestByAdmin: 0,
  print_count: 0,
};

export default PrintDocumentDialog;
