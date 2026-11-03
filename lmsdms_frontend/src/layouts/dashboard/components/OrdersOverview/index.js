import React, { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import LinearProgress from "@mui/material/LinearProgress";
import { useDocTimeLineQuery } from "api/auth/timeLineApi";
import PropTypes from "prop-types";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { styled } from "@mui/system";

const TimelineItem = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  position: "relative",
  marginBottom: theme.spacing(4),
  "&:before": {
    content: '""',
    position: "absolute",
    left: 12,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: theme.palette.grey[300],
  },
}));

const TimelineDot = styled("div")(({ theme, color }) => ({
  width: 24,
  height: 24,
  backgroundColor: theme.palette[color]?.main || theme.palette.grey[300],
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: theme.palette.common.white,
  zIndex: 1,
  position: "relative",
}));

const OrdersOverview = ({ docId }) => {
  const { data, isLoading, error } = useDocTimeLineQuery(docId);
  const [timelineData, setTimelineData] = useState([]);

  useEffect(() => {
    if (data) {
      let timelineItems = [];

      const addItem = (actions, title, icon, color) => {
        if (actions.length > 0) {
          actions.forEach((action) => {
            timelineItems.push({
              title,
              name: action?.name,
              notes: action.remarks_sendback || action.remarks_reviewer || action.remarks_author || action.remarks_approver || "No remarks available", 
              dateTime: action.created_at, // Keep original format for sorting
              formattedDate: new Date(action.created_at).toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }),
              icon,
              color,
            });
          });
        }
      };

      addItem(data.author_approvals, "Author Approval", <CheckCircleOutlineIcon />, "success");
      addItem(data.reviewer_actions, "Reviewer Actions", <CheckCircleOutlineIcon />, "success");
      addItem(data.approver_actions, "Approver Actions", <CheckCircleOutlineIcon />, "success");
      addItem(data.doc_admin_actions, "Document Admin Actions", <CheckCircleOutlineIcon />, "success");
      addItem(data.release_actions, "Release Actions", <CheckCircleOutlineIcon />, "success");
      addItem(data.effective_actions, "Effective Actions", <CheckCircleOutlineIcon />, "success");
      addItem(data.revision_actions, "Revision Actions", <CheckCircleOutlineIcon />, "success");
      addItem(data.revision_requests, "Revision Requests", <ErrorOutlineIcon />, "success");
      addItem(data.send_back_actions, "Send Back Actions", <HourglassTopIcon />, "error");

      // Sort timeline items by date in descending order (latest first)
      timelineItems.sort((a, b) =>  new Date(b.dateTime) - new Date(a.dateTime));

      setTimelineData(timelineItems);
    }
  }, [data]);

  if (isLoading) {
    return (
      <Card sx={{ height: "100%" }}>
        <MDBox pt={3} px={3}>
          <MDTypography variant="h4" fontWeight="medium">
            Loading Timeline...
          </MDTypography>
          <LinearProgress sx={{ marginTop: 2 }} />
        </MDBox>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ height: "100%" }}>
        <MDBox pt={3} px={3}>
          <MDTypography variant="h4" fontWeight="medium">
            Error loading timeline.
          </MDTypography>
        </MDBox>
      </Card>
    );
  }

  return (
    <Card sx={{ height: "100%", overflow: "auto" }}>
      <MDBox pt={3} px={3}>
        <MDTypography variant="h4" fontWeight="medium">
          Document Timeline
        </MDTypography>
      </MDBox>
      <MDBox p={2} display="flex" flexDirection="column" gap={2}>
        {timelineData.length > 0 ? (
          timelineData.map((item, index) => (
            <TimelineItem key={index}>
              <TimelineDot color={item.color}>{item.icon}</TimelineDot>
              <Card sx={{ flexGrow: 1, ml: 3, backgroundColor: "#f9f9f9" }}>
                <CardContent>
                <MDTypography variant="h6" fontWeight="bold">
  {item?.title} - {item?.name?.toUpperCase()} {/* Display the name */}
</MDTypography>
                  <MDTypography variant="body2" color="textSecondary">
                    {item?.notes}
                  </MDTypography>
                  <MDTypography variant="caption" color="textSecondary">
                    {item?.formattedDate}
                  </MDTypography>
                </CardContent>
              </Card>
            </TimelineItem>
          ))
        ) : (
          <MDTypography variant="h6" color="textSecondary">
            No actions to show for this document.
          </MDTypography>
        )}
      </MDBox>
    </Card>
  );
};

OrdersOverview.propTypes = {
  docId: PropTypes.string.isRequired,
};

export default OrdersOverview;
