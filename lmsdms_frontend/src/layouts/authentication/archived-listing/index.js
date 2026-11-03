import React, { useState } from "react";
import Card from "@mui/material/Card";
import { DataGrid } from "@mui/x-data-grid";
import IconButton from "@mui/material/IconButton";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import { useFetchDocumentVersionListQuery } from "api/auth/documentApi";
import LocalPrintshopTwoToneIcon from "@mui/icons-material/LocalPrintshopTwoTone";
import { useArchivedPrintConvertPdfMutation } from "api/auth/printApi";
import { useNavigate } from "react-router-dom";
const ArchivedListing = () => {
    const navigate = useNavigate();
    const [selectedDocumentId, setSelectedDocumentId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const { data: versions = [], isLoading: versionsLoading } = useFetchDocumentVersionListQuery(
        selectedDocumentId || null
    );
    const [convertToPdf, { isLoading: isConverting }] = useArchivedPrintConvertPdfMutation();
    const handleSearch = (event) => {
        setSearchTerm(event.target.value.toLowerCase());
    };
    const handlePrint = async (documentId, documentStatus) => {
        try {
            const response = await convertToPdf({
                sop_document_id: documentId,
                document_status: documentStatus
            }).unwrap();

            if (response?.pdf_link) {
                // Open the PDF in a new tab for printing
                window.open(response.pdf_link, "_blank");
            } else {
                console.error("Failed to generate PDF");
            }
        } catch (error) {
            console.error("Error converting document to PDF:", error);
        }
    };
    const columns = [
        // { field: "sr", headerName: "Sr", flex: 0.3, headerAlign: "center", valueGetter: (params) => params.rowIndex + 1 },
        {
            field: "index",
            headerName: "Sr.No.",
            flex: 0.3,
            headerAlign: "center",
            renderCell: (params) =>{ 
                // console.log(params)
                return(<span>{params.row.id }</span>)
        },
            sortable: false,
            filterable: false,
        },
        { field: "document_title", headerName: "Document Title", flex: 1, headerAlign: "center" },
        { field: "document_type", headerName: "Document Type", flex: 1, headerAlign: "center" },
        { field: "document_number", headerName: "Document Number", flex: 1, headerAlign: "center" },
        { field: "version", headerName: "Version", flex: 1, headerAlign: "center" },
        { field: "document_current_status_name", headerName: "Status", flex: 1, headerAlign: "center" },
        {
            field: "print",
            headerName: "Print",
            flex: 0.5,
            headerAlign: "center",
            renderCell: (params) => (
                <IconButton 
                    color="error" 
                    onClick={() => handlePrint(params.row.document_id, params.row.document_current_status_name)}
                    disabled={isConverting}
                >
                    <LocalPrintshopTwoToneIcon />
                </IconButton>
            )
        },
        {
            field: "action",
            headerName: "View",
            flex: 0.5,
            headerAlign: "center",
            renderCell: (params) => 
                (
                <IconButton
                    color="warning"
                    onClick={() =>
                      {  
                        console.log("Paramss",params)
                        //     navigate("/archived-docviewer", {
                            // state: { front_file_url: params.row.front_file_url }
                        // }
                        // )
                        navigate("/docviewer", { state: { docId: params.row.document_id, templateId: params.row.select_template } });
                    }
                    }
                >
                    <VisibilityIcon />
                </IconButton>
            )
            // {console.log(params.row.front_file_url)}
        }
    ];

    const filteredRows = versions?.filter(version => 
        version.document_title.toLowerCase().includes(searchTerm)
    ).map((version, index) => ({ id: index + 1, rowIndex: index, ...version })) || [];

    return (
        <MDBox p={3}>
            {/* <Card sx={{ maxWidth: "90%", mx: "auto", mt: 3,ml:3 }}> */}
            <Card sx={{ maxWidth: "80%",maxHeight:"80%", mx: "auto", mt: 3, marginLeft: "auto", marginRight: 5 }}>
                <MDBox p={3}>
                <MDBox 
                        display="flex" 
                        justifyContent="space-between" 
                        alignItems="center" 
                        mb={2}
                    >
                        <MDInput
                            label="Search by Document Title"
                            variant="outlined"
                            size="small"
                            value={searchTerm}
                            onChange={handleSearch}
                            sx={{ width: "300px" }}
                        />
                        <MDTypography variant="h4" fontWeight="medium" sx={{ textAlign: "center", flexGrow: 1 }}>
                            Archived Listing
                        </MDTypography>
                    </MDBox>
                    <MDBox display="flex" justifyContent="center">
                        <div style={{flexGrow: 1, height: 700, width: "100%" }}>
                            <DataGrid
                                rows={filteredRows}
                                columns={columns}
                                pageSize={5}
                                rowsPerPageOptions={[5, 10, 20]}
                                disableSelectionOnClick
                                loading={versionsLoading}
                                sx={{
                                    border: "1px solid #ddd",
                                    borderRadius: "4px",
                                    "& .MuiDataGrid-columnHeaders": {
                                        backgroundColor: "#f5f5f5",
                                        fontWeight: "bold",
                                    },
                                    "& .MuiDataGrid-cell": {
                                        textAlign: "center",
                                    },
                                }}
                            />
                        </div>
                    </MDBox>
                </MDBox>
            </Card>
        </MDBox>
    );
};

export default ArchivedListing;