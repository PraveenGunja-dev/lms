// import React, { forwardRef, useState } from "react";
// import {
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   IconButton,
//   TextField,
//   Typography,
//   MenuItem,
//   Button,
//   Snackbar,
//   Alert,
// } from "@mui/material";
// import CloseIcon from "@mui/icons-material/Close";
// import PropTypes from 'prop-types';

// const AddMaterialModal = forwardRef((props, ref) => {
//   const {
//     open,
//     handleClose,
//     materialNameRef,
//     minReadingTimeRef,
//     fileRef,
//     materialType,
//     setMaterialType,
//     handleSubmit,
//   } = props;

//   const [openSnackbar, setOpenSnackbar] = useState(false);
//   const [errorMessage, setErrorMessage] = useState("");
//   console.log(materialNameRef,minReadingTimeRef)
//   const handleCloseSnackbar = () => {
//     setOpenSnackbar(false);
//   };

//   // const handleFormSubmit = (event) => {
//   //   event.preventDefault();
//   //   let hasError = false;
//   //   let errorMessage = "";

//   //   if (!materialNameRef.current.value) {
//   //     hasError = true;
//   //     errorMessage = "Material Name is required";
//   //   }

//   //   if (!minReadingTimeRef.current.value) {
//   //     hasError = true;
//   //     errorMessage = "Min Reading Time is required";
//   //   }

//   //   if (!materialType) {
//   //     hasError = true;
//   //     errorMessage = "Material Type is required";
//   //   }
//   //   if (fileRef.current.files.length === 0) {
//   //       hasError = true;
//   //       errorMessage = "Please select a file";
//   //     }

//   //   if (hasError) {
//   //     setOpenSnackbar(true);
//   //     setErrorMessage(errorMessage);
//   //     return;
//   //   }
//   //   console.log(minReadingTimeRef,fileRef,materialNameRef,materialType) 
//   // };
  
//   return (
//     <div>
//     <Dialog
//       onClose={handleClose}
//       open={open}
//       aria-labelledby="add-section-dialog-title"
//       fullWidth
//       maxWidth="sm"
//     >
//       <DialogTitle id="add-section-dialog-title" sx={{ m: 0, p: 2 }}>
//         Add Material
//         <IconButton
//           aria-label="close"
//           onClick={handleClose}
//           sx={{
//             position: "absolute",
//             right: 8,
//             top: 8,
//             color: (theme) => theme.palette.grey[500],
//           }}
//         >
//           <CloseIcon />
//         </IconButton>
//       </DialogTitle>
//       <DialogContent dividers>
//         <form onSubmit={handleSubmit}>
//           {/* Material Name */}
//           <TextField
//             inputRef={materialNameRef}
//             type="text"
//             label="Material Name"
//             fullWidth
//             margin="normal"
//             sx={{
//                 mt:'2px'
//             }}
//           />

//           {/* Min Reading Time */}
//           <TextField
//             inputRef={minReadingTimeRef}
//             type="number"
//             label="Min Reading Time (mins)"
//             fullWidth
//             margin="normal"
//             InputProps={{ inputProps: { min: 1 } }}
//           />

//           {/* Material Type */}
//           <TextField
//             select
//             label="Material Type"
//             fullWidth
//             margin="normal"
//             value={materialType}
//             onChange={(e) => setMaterialType(e.target.value)}
//             InputProps={{
//               sx: {
//                 height: 50, // Adjust height
//                 fontSize: "1rem", // Adjust font size for better readability
//               },
//             }}
//             SelectProps={{
//               sx: {
//                 padding: "10px", // Adjust padding inside the select
//               },
//             }}
//           >
//             <MenuItem value="PDF">PDF</MenuItem>
//             <MenuItem value="Video">Video</MenuItem>
//             <MenuItem value="Document">Document</MenuItem>
//           </TextField>

//           {/* File Upload */}
//           <Typography variant="body2" gutterBottom 
//           sx={{ mt: 2}}>
//             Upload Document
//           </Typography>
//           <input
//             ref={fileRef}
//             type="file"
//             accept=".pdf,.doc,.docx,.mp4"
//             style={{ marginTop: "8px", marginBottom: "16px",fontSize:'16px' }}
//           />

//           <Button variant="custom" 
//           sx={{
//             color:'white !important',
//             background:'#31AC47',
//             padding:'12px',
//             '&:hover':{
//                 backgroundColor:'#1ebf39',
//             }
//           }}  type="submit" fullWidth>
//             Submit
//           </Button>
//         </form>
//       </DialogContent>
//     </Dialog>
//     <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
//         <Alert severity="error" onClose={handleCloseSnackbar}>
//           {errorMessage}
//         </Alert>
//       </Snackbar>
//     </div>
//   );
// });

// AddMaterialModal.propTypes = {
//     open: PropTypes.bool.isRequired,
//     handleClose: PropTypes.func.isRequired,
//     materialNameRef: PropTypes.object.isRequired,
//     minReadingTimeRef: PropTypes.object.isRequired,
//     fileRef: PropTypes.object.isRequired,
//     materialType: PropTypes.string.isRequired,
//     setMaterialType: PropTypes.func.isRequired,
//     handleSubmit: PropTypes.func.isRequired,
//   };

// export default AddMaterialModal;
