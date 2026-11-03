import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Dialog, DialogActions, DialogContent, TextField } from "@mui/material";
import MDButton from "components/MDButton";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { useApproveReviseMutation } from "api/auth/reviseApi";  
import { toast } from "react-toastify";
import { getErrorMessage } from "services/baseQuery";
import "react-toastify/dist/ReactToastify.css"; // Import toast styles

const ReviseApproveDialog = ({ open, onClose, onApprove, onReject, row }) => {
    const [reason, setReason] = useState("");
    const [approveRevise, { isLoading }] = useApproveReviseMutation();
    const [remarks, setRemark] = useState(""); 
    useEffect(() => {
        if (row) {
            setReason(row?.revisereason || ""); 
        }
    }, [row]); 

    const handleApprove = async () => {
        try {
            await approveRevise({
                document_id: row?.id, 
                status_id: 10,
                request_action_id: row?.revise_request_id,
                action_status: "approved",
            }).unwrap();
            
            toast.success("Revision Approved Successfully!");
            onApprove(reason, row?.id, row?.id);
            onClose();
        } catch (error) {
            toast.error(getErrorMessage(error, "Error approving revise!"));
            console.error("Error approving revise:", error);
        }
    };

    const handleReject = async () => {
        try {
            await approveRevise({
                document_id: row?.id,
                status_id: 11,
                request_action_id: row?.revise_request_id,
                action_status: "rejected",
                remarks,
            }).unwrap();
            
            toast.success("Revision Rejected Successfully!");
            onReject(reason, row?.id, row?.id);
            onClose();
        } catch (error) {
            toast.error(getErrorMessage(error, "Error rejecting revise!"));
            console.error("Error rejecting revise:", error);
        }
    };

    if (!row) return null;

    return (
        <>
           
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <MDBox sx={{ textAlign: "center" }}>
                    <MDTypography variant="h4" fontWeight="medium" color="#344767" mt={1}>
                        Revise Approve
                    </MDTypography>
                </MDBox>

                <form onSubmit={(e) => e.preventDefault()}>
                    <DialogContent>
                        <MDBox sx={{ marginTop: 2, textAlign: "center" }}>
                            <TextField
                                fullWidth
                                label="Reason"
                                variant="outlined"
                                value={reason}
                                InputProps={{ readOnly: true }}
                                multiline
                                rows={7}
                                required
                            />
                        </MDBox>
                        <MDBox sx={{ marginTop: 2 }}>
                        <TextField
                            fullWidth
                            label="Remark"
                            variant="outlined"
                            value={remarks}
                            onChange={(e) => setRemark(e.target.value)}
                            multiline
                            rows={5}
                            placeholder="Enter your remark "
                        />
                    </MDBox>
                    </DialogContent>

                    <DialogActions>
                        <MDButton onClick={onClose} color="error" sx={{ marginRight: "10px" }}>
                            Cancel
                        </MDButton>
                        <MDBox sx={{ display: "flex", gap: 2 }}>
                            <MDButton
                                variant="gradient"
                                color="success"
                                onClick={handleApprove}
                                disabled={isLoading}
                            >
                                Approve
                            </MDButton>

                            <MDButton
                                variant="gradient"
                                color="warning"
                                onClick={handleReject}
                                disabled={isLoading}
                            >
                                Reject
                            </MDButton>
                        </MDBox>
                    </DialogActions>
                </form>
            </Dialog>
        </>
    );
};

ReviseApproveDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onApprove: PropTypes.func.isRequired,
    onReject: PropTypes.func.isRequired,
    row: PropTypes.shape({
        id: PropTypes.number.isRequired,
        documentTitle: PropTypes.string.isRequired,
        revisereason: PropTypes.string,
        reviseStatus: PropTypes.string,
        requestedUser: PropTypes.string,
        serial_number: PropTypes.number,
        revise_request_id: PropTypes.number,
    }).isRequired,
};

export default ReviseApproveDialog;
