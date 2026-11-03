import React from "react";
import { Grid } from "@mui/material";
import { useGetDashboardCountsQuery } from "api/auth/dashboardApi"; // Make sure to import the API hook
import MDBox from "components/MDBox";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import TopicIcon from "@mui/icons-material/Topic";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import ApartmentIcon from "@mui/icons-material/Apartment";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DraftsIcon from "@mui/icons-material/Drafts";
import TaskIcon from "@mui/icons-material/Task";
import CancelPresentationTwoToneIcon from "@mui/icons-material/CancelPresentationTwoTone";
import RateReviewTwoToneIcon from "@mui/icons-material/RateReviewTwoTone";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import ArchiveIcon from "@mui/icons-material/Archive";
import GetAppOutlinedIcon from "@mui/icons-material/GetAppOutlined";
import PrintDisabledIcon from '@mui/icons-material/PrintDisabled';
import { Link } from "react-router-dom";
import {
  useGetDocumentDataOfStatusIdElevenQuery,
  useGetDocumentDataOfStatusIdNineQuery,
  useGetDocumentDataOfStatusIdThreeQuery,
  useGetDocumentDataOfStatusIdTwoQuery,
  useGetDocumentDataOfStatusIdFourQuery,
  useGetDocumentDataOfStatusIdnintyQuery,
  useGetDocumentVersionCountQuery
} from "api/auth/dashboardApi";
import { useGetPrintRequestsQuery } from "api/auth/printApi";
import { useAuth } from "hooks/use-auth";
import { useReviseRequestGetQuery } from "api/auth/reviseApi";
import { useGetPrintRejectDocumentDataQuery } from "api/auth/dashboardApi";
function Dashboard() {
  const { data, error, isLoading } = useGetDashboardCountsQuery(); // Fetch the dashboard counts
  const {
    data: rejectedData,
    isLoading: loadingRejected,
    error: rejectedError,
  } = useGetDocumentDataOfStatusIdElevenQuery({
    departmentId: "",
    startDate: "",
    endDate: "",
  });
  const {
    data: printdata,
    isLoading: loadingprint,
    error: printError,
  } = useGetPrintRequestsQuery({
    status_id: 13,
  });
  const {
    data: retrievaldata,
    isLoading: loadingretrieval,
    error: retrievalError,
  } = useReviseRequestGetQuery(undefined, {
    refetchOnFocus: true, // when user comes back to tab
    refetchOnReconnect: true, // if internet reconnects
  });
  const {
    data: approveData,
    isLoading: loadingApprove,
    error: approveError,
  } = useGetDocumentDataOfStatusIdNineQuery({
    departmentId: "",
    startDate: "",
    endDate: "",
  });
  const {
    data: underapproveData,
    isLoading: loadingunderApprove,
    error: approveunderError,
  } = useGetDocumentDataOfStatusIdFourQuery({
    departmentId: "",
    startDate: "",
    endDate: "",
  });
  const {
    data: reviewData,
    isLoading: loadingReview,
    error: reviewError,
  } = useGetDocumentDataOfStatusIdThreeQuery({
    departmentId: "",
    startDate: "",
    endDate: "",
  });
  const {
    data: rejectedPrintData,
    isLoading: loadingRejectedPrint,
    error: errorRejectedPrint,
  } = useGetPrintRejectDocumentDataQuery();
  const { data: totalCount,
     isLoading: loadingDocumentVersionCount, 
    error: documentVersionCountError
  } = useGetDocumentVersionCountQuery();
  const {
    data: savedraftData,
    isLoading: loadingSavedraft,
    error: savedraftError,
  } = useGetDocumentDataOfStatusIdTwoQuery({
    departmentId: "",
    startDate: "",
    endDate: "",
  });
  const {
    data: nintyData,
    isLoading: loadingnintyData,
    error: nintyDataError,
  } = useGetDocumentDataOfStatusIdnintyQuery({
    departmentId: "",
    startDate: "",
    endDate: "",
  });
  const { user } = useAuth();
  const isDocAdmin = user?.user_permissions?.group.id;

  // console.log("User CCtct",isDocAdmin)
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading dashboard data</div>;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <Link to="/user-listing">
                <ComplexStatisticsCard
                  color="primary"
                  icon={<PersonAddIcon />}
                  title="User"
                  count={data?.user_count || 0}
                  percentage={{
                    color: "success",
                    label: "Updated yesterday",
                  }}
                />
              </Link>
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <Link to="/document-listing">
                <ComplexStatisticsCard
                  icon={<TopicIcon />}
                  color="warning"
                  title="Document"
                  count={data?.document_count || 0}
                  percentage={{
                    color: "success",
                    label: "Just updated",
                  }}
                />
              </Link>
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <Link to="/department-listing">
                <ComplexStatisticsCard
                  color="success"
                  icon={<ApartmentIcon />}
                  title="Department"
                  count={data?.department_count || 0}
                  percentage={{
                    color: "success",
                    label: "Just updated",
                  }}
                />
              </Link>
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <Link to="/workflow-listing">
                <ComplexStatisticsCard
                  color="dark"
                  icon={<AssignmentTurnedInIcon />}
                  title="WorkFlow"
                  count={data?.workflow_count || 0}
                  percentage={{
                    color: "success",
                    label: "Updated yesterday",
                  }}
                />
              </Link>
            </MDBox>
          </Grid>
        </Grid>
      </MDBox>

      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <Link to="/review-document">
                <ComplexStatisticsCard
                  icon={<RateReviewTwoToneIcon />}
                  color="warning"
                  title="Under Review"
                  count={reviewData?.dataCountreview || 0}
                  percentage={{
                    color: "success",
                  }}
                />
              </Link>
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <Link to="/reject-document">
                <ComplexStatisticsCard
                  color="error"
                  icon={<CancelPresentationTwoToneIcon />}
                  title="Rejected"
                  count={rejectedData?.dataCountreject || 0}
                  percentage={{
                    color: "success",
                  }}
                />
              </Link>
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <Link to="/approve-document">
                <ComplexStatisticsCard
                  color="success"
                  icon={<TaskIcon />}
                  title="Approved"
                  count={approveData?.dataCountapprove || 0}
                  percentage={{
                    color: "success",
                  }}
                />
              </Link>
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <Link to="/due-sop-document">
                <ComplexStatisticsCard
                  color="dark"
                  icon={<TaskIcon />}
                  title="Due Sop "
                  count={nintyData?.dataCountSOP || 0}
                  percentage={{
                    color: "success",
                  }}
                />
              </Link>
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <Link to="/under-approve-document">
                <ComplexStatisticsCard
                  color="success"
                  icon={<TaskIcon />}
                  title="Under Approve"
                  count={underapproveData?.dataCountapproved || 0}
                  percentage={{
                    color: "success",
                  }}
                />
              </Link>
            </MDBox>
          </Grid>
          {isDocAdmin == 5 && (
            <Grid item xs={12} md={6} lg={3}>
              <MDBox mb={1.5}>
                <Link to="/approval-listing">
                  <ComplexStatisticsCard
                    color="dark"
                    icon={<PendingActionsIcon />}
                    title="Print Approval"
                    count={printdata?.total || 0}
                    percentage={{
                      color: "success",
                    }}
                  />
                </Link>
              </MDBox>
            </Grid>
          )}

          {isDocAdmin == 5 && (
            <Grid item xs={12} md={6} lg={3}>
              <MDBox mb={1.5}>
                <Link to="/revise-listing">
                  <ComplexStatisticsCard
                    color="warning"
                    icon={<PendingActionsIcon />}
                    title="Doc Revision Request"
                    count={retrievaldata?.pending_revise_count || 0}
                    percentage={{
                      color: "success",
                    }}
                  />
                </Link>
              </MDBox>
            </Grid>
          )}
          {isDocAdmin == 5 && (
            <Grid item xs={12} md={6} lg={3}>
              <MDBox mb={1.5}>
                <Link to="/archived-listing">
                  <ComplexStatisticsCard
                    color="error"
                    icon={<ArchiveIcon />}
                    title="Archived"
                    count={totalCount?.totalCount || 0}
                    percentage={{
                      color: "success",
                    }}
                  />
                </Link>
              </MDBox>
            </Grid>
          )}
          {isDocAdmin == 5 && (
            <Grid item xs={12} md={6} lg={3}>
              <MDBox mb={1.5}>
                <Link to="/retrieval-listing">
                  <ComplexStatisticsCard
                    color="primary"
                    icon={<GetAppOutlinedIcon />}
                    title="Print Retrieval"
                    // count={printdata?.total || 0}
                    percentage={{
                      color: "success",
                    }}
                  />
                </Link>
              </MDBox>
            </Grid>
          )}
          {isDocAdmin == 5 && (
            <Grid item xs={12} md={6} lg={3}>
              <MDBox mb={1.5}>
                <Link to="/rejected-print-doc-list">
                  <ComplexStatisticsCard
                    color="error"
                    icon={<PrintDisabledIcon />}
                    title="Rejected Print Request"
                    count={rejectedPrintData?.dataCount || 0}
                    percentage={{
                      color: "success",
                    }}
                  />
                </Link>
              </MDBox>
            </Grid>
          )}
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}

export default Dashboard;
