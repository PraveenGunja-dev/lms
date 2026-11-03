import Dashboard from "layouts/dashboard";
import AddUser from "layouts/authentication/add-user";
import AddDepartment from "layouts/authentication/add-department";
import AddDocument from "layouts/authentication/add-document";
import Icon from "@mui/material/Icon";
import LMSDashboard from "layouts/authentication/lms-dashboard";
import TopicIcon from "@mui/icons-material/Topic";
import ApartmentIcon from "@mui/icons-material/Apartment";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DocumentListing from "layouts/authentication/document-listing";
import UsersListing from "layouts/authentication/user-listing";
import WorkflowListing from "layouts/authentication/workflow-listing";
import StatusListing from "layouts/authentication/status-handle";
import DocumentTypesListing from "layouts/authentication/document-typelisting";
import TemplateListing from "layouts/authentication/template-listing";
import InventoryListing from "layouts/authentication/inventory-handle";
import DepartmentListing from "layouts/authentication/department-listing";
import RolesPermissionsListing from "layouts/authentication/roles-listing";
import PrintApprovalListing from "layouts/authentication/approval-lisitng";
import PrinterListing from "layouts/authentication/printer-listing";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import ReviseApprovalList from "layouts/authentication/revise-Listing";
import PrintRetrievalListing from "layouts/retrieval-listing";
import GetAppOutlinedIcon from "@mui/icons-material/GetAppOutlined";
import FactoryTwoToneIcon from "@mui/icons-material/FactoryTwoTone";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SettingsIcon from "@mui/icons-material/Settings";
import ApprovalIcon from "@mui/icons-material/ThumbUp";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import AssignmentReturnIcon from "@mui/icons-material/Inventory2";
import ImportContactsTwoToneIcon from "@mui/icons-material/ImportContactsTwoTone";
import icon from "assets/theme/components/icon";
import PlantListing from "dmscomponent/plant-listing";
import AreaListing from "dmscomponent/area-listing";
import HomeMiniRoundedIcon from "@mui/icons-material/HomeMiniRounded";
import MethodologyListing from "dmscomponent/methodology-listing";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import TrainingTypeListing from "dmscomponent/trainingType-Listing";
import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import InductionListing from "dmscomponent/induction-training/induction-listing";
import QuizListing from "dmscomponent/add-quiz/list";
import DevicesFoldTwoToneIcon from "@mui/icons-material/DevicesFoldTwoTone";
import ModelTrainingTwoToneIcon from "@mui/icons-material/ModelTrainingTwoTone";
import TrainingListing from "dmscomponent/Training-listing";
import QuestionListing from "dmscomponent/question-listing";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import WorkTwoToneIcon from "@mui/icons-material/WorkTwoTone";
import JobroleListing from "dmscomponent/job-listing";
import TrainingMapping from "dmscomponent/training-mappping";
import JobRoleMapping from "dmscomponent/jobrole-mapping";
import DisplaySettingsRoundedIcon from "@mui/icons-material/DisplaySettingsRounded";
import ForkRightTwoToneIcon from "@mui/icons-material/ForkRightTwoTone";
import ArchivedListing from "layouts/authentication/archived-listing";
import ClassroomListing from "dmscomponent/class-room";
import ViewEmployeeStatus from "dmscomponent/view-employees";
import ArchiveIcon from "@mui/icons-material/Archive";
import GroupIcon from "@mui/icons-material/Group";
import SchoolTwoToneIcon from "@mui/icons-material/SchoolTwoTone";
import Diversity1Icon from "@mui/icons-material/Diversity1";
import UserReports from "dmscomponent/user-reports";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";

const routes = [
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    icon: <DashboardIcon fontSize="small" />,
    route: "/dashboard",
    component: <Dashboard />,
    routeCat:"lms"
  },
  {
    type: "collapse",
    name: "LMS Dashboard",
    key: "lms-dashboard",
    icon: <DashboardIcon fontSize="small" />,
    route: "/lms-dashboard",
    component: <LMSDashboard />,
    routeCat:"lms"

  },
  {
    type: "collapse",
    name: "User Management",
    key: "user-listing",
    icon: <PersonAddIcon />,
    route: "/user-listing",
    component: <UsersListing />,
    routeCat:"lms"

  },
  {
    type: "collapse",
    name: "Departments",
    key: "department-listing",
    icon: <ApartmentIcon />,
    route: "/department-listing",
    component: <DepartmentListing />,
    routeCat:"lms"
  },
  {
    type: "collapse",
    name: "Documents",
    key: "document-listing",
    icon: <LibraryBooksIcon />,
    route: "/document-listing",
    component: <DocumentListing />,
    routeCat:"lms"
  },
  {
    type: "collapse",
    name: "Workflows",
    key: "workflow-listing",
    icon: <WorkspacesIcon />,
    route: "/workflow-listing",
    component: <WorkflowListing />,
    routeCat:"lms"
  },
  {
    type: "collapse",
    name: "Status Management",
    key: "status-list",
    icon: <SettingsIcon />,
    route: "/status-list",
    component: <StatusListing />,
    routeCat:"lms"
  },
  {
    type: "collapse",
    name: "Document Types",
    key: "document-typelisting",
    icon: <AssignmentIcon />,
    route: "/document-typelisting",
    component: <DocumentTypesListing />,
    routeCat:"lms"
  },
  {
    type: "collapse",
    name: "Templates",
    key: "template-listing",
    icon: <TopicIcon />,
    route: "/template-listing",
    component: <TemplateListing />,
    routeCat:"lms"
  },
  {
    type: "collapse",
    name: "Inventory",
    key: "inventory-list",
    icon: <Inventory2Icon />,
    route: "/inventory-list",
    component: <InventoryListing />,
    routeCat:"lms"
  },
  // {
  //   type: "collapse",
  //   name: "Archived",
  //   key: "archived-listing",
  //   icon: <ArchiveIcon />,
  //   route: "/archived-listing",
  //   component: <ArchivedListing />,
  //   routeCat:"lms"
  // },
  // {
  //   type: "collapse",
  //   name: "Roles & Permissions",
  //   key: "roles-listing",
  //   icon: <SettingsIcon />,
  //   route: "/roles-listing",
  //   component: <RolesPermissionsListing />,
  // },
  {
    type: "collapse",
    name: "Print Approvals",
    key: "approval-listing",
    icon: <ApprovalIcon />,
    route: "/approval-listing",
    component: <PrintApprovalListing />,
    routeCat:"lms"
  },
  {
    type: "collapse",
    name: "Printer",
    key: "printer-listing",
    icon: <LocalPrintshopIcon />,
    route: "printer-listing",
    component: <PrinterListing />,
    routeCat:"lms"
  },
  // {
  //   type: "collapse",
  //   name: "Print Retrieval",
  //   key: "retrieval-listing",
  //   icon: <GetAppOutlinedIcon />,
  //   route: "/retrieval-listing",
  //   component: <PrintRetrievalListing />,
  //   routeCat:"dms"
  // },
  {
    type: "collapse",
    name: "Doc  Revision Request",
    key: "revise-listing",
    icon: <ImportContactsTwoToneIcon />,
    route: "/revise-listing",
    component: <ReviseApprovalList />,
    routeCat:"dms"
  },
  {
    type: "collapse",
    name: "Plants",
    key: "plant-listing",
    icon: <FactoryTwoToneIcon />,
    route: "/plant-listing",
    component: <PlantListing />,
    routeCat:"dms"
  },
  {
    type: "collapse",
    name: "Area",
    key: "area-listing",
    icon: <HomeMiniRoundedIcon />,
    route: "/area-listing",
    component: <AreaListing />,
    routeCat:"dms"
  },
  {
    type: "collapse",
    name: "Methodology",
    key: "methodology-listing",
    icon: <AccountTreeIcon />,
    route: "/methodology-listing",
    component: <MethodologyListing />,
    routeCat:"dms"
  },
  {
    type: "collapse",
    name: "Training Type",
    key: "trainingType-Listing",
    icon: <DevicesFoldTwoToneIcon />,
    route: "/trainingType-Listing",
    component: <TrainingTypeListing />,
    routeCat:"dms"
  },
  {
    type: "collapse",
    name: "Induction Set",
    key: "induction-Listing",
    icon: <AccountTreeIcon />,
    route: "/induction-Listing",
    component: <InductionListing />,
    routeCat:"dms"
  },
  {
    type: "collapse",
    name: "Training Activity",
    key: "trainingListing",
    icon: <ModelTrainingTwoToneIcon />,
    route: "/trainingListing",
    component: <TrainingListing />,
    routeCat:"dms"
  },
  {
    type: "collapse",
    name: "Job Role",
    key: "jobRole-listing",
    icon: <WorkTwoToneIcon />,
    route: "/jobRole-listing",
    component: <JobroleListing />,
    routeCat:"dms"
  },
  {
    type: "collapse",
    name: "Training Mapping",
    key: "trainingMapping-listing",
    icon: <ForkRightTwoToneIcon />,
    route: "/trainingMapping-listing",
    component: <TrainingMapping />,
    routeCat:"dms"
  },
  {
    type: "collapse",
    name: "Job Role Mapping",
    key: "jobrole-mapping",
    icon: <DisplaySettingsRoundedIcon />,
    route: "/jobrole-mapping",
    component: <JobRoleMapping />,
    routeCat:"dms"
  },
  {
    type: "collapse",
    name: "Quiz Listinng",
    key: "quiz-list",
    icon: <ForkRightTwoToneIcon />,
    route: "/quiz-list",
    component: <QuizListing />,
    routeCat:"dms"
  },
];
export const LmsRoutes = [
  {
    type: "collapse",
    name: "LMS Dashboard",
    key: "lms-dashboard",
    icon: <DashboardIcon fontSize="small" />,
    route: "/lms-dashboard",
    component: <LMSDashboard />,
  },
  {
    type: "collapse",
    name: "User Management",
    key: "user-listing",
    icon: <PersonAddIcon />,
    route: "/user-listing",
    component: <UsersListing />,
  },
  {
    type: "collapse",
    name: "LMS  User Report",
    key: "user-reports",
    icon: <AssessmentOutlinedIcon />,
    route: "/user-reports",
    component: <UserReports />,
  },
  {
    type: "collapse",
    name: "Employee Workflow",
    key: "employee-workflow",
    icon: <AssignmentIndOutlinedIcon fontSize="small" />,
    route: "/employee-workflow",
    component: <ViewEmployeeStatus />,
  },
  {
    type: "collapse",
    name: "Plants",
    key: "plant-listing",
    icon: <FactoryTwoToneIcon />,
    route: "/plant-listing",
    component: <PlantListing />,
  },
  {
    type: "collapse",
    name: "Area",
    key: "area-listing",
    icon: <HomeMiniRoundedIcon />,
    route: "/area-listing",
    component: <AreaListing />,
  },
  {
    type: "collapse",
    name: "Methodology",
    key: "methodology-listing",
    icon: <AccountTreeIcon />,
    route: "/methodology-listing",
    component: <MethodologyListing />,
  },
  {
    type: "collapse",
    name: "Training Type",
    key: "trainingType-Listing",
    icon: <DevicesFoldTwoToneIcon />,
    route: "/trainingType-Listing",
    component: <TrainingTypeListing />,
  },
  {
    type: "collapse",
    name: "Induction Set",
    key: "induction-Listing",
    icon: <AccountTreeIcon />,
    route: "/induction-Listing",
    component: <InductionListing />,
  },
  {
    type: "collapse",
    name: "Training Activity",
    key: "trainingListing",
    icon: <ModelTrainingTwoToneIcon />,
    route: "/trainingListing",
    component: <TrainingListing />,
  },
  {
    type: "collapse",
    name: "Trainer ",
    key: "trainer-listing",
    icon: <Diversity1Icon />,
    route: "/trainer-listing",
    component: <TrainingListing />,
  },
  {
    type: "collapse",
    name: "Job Role",
    key: "jobRole-listing",
    icon: <WorkTwoToneIcon />,
    route: "/jobRole-listing",
    component: <JobroleListing />,
  },
  // {
  //   type: "collapse",
  //   name: "Training Mapping",
  //   key: "trainingMapping-listing",
  //   icon: <ForkRightTwoToneIcon />,
  //   route: "/trainingMapping-listing",
  //   component: <TrainingMapping />,
  // },
  // {
  //   type: "collapse",
  //   name: "Job Role Mapping",
  //   key: "jobrole-mapping",
  //   icon: <DisplaySettingsRoundedIcon />,
  //   route: "/jobrole-mapping",
  //   component: <JobRoleMapping />,
  // },
  {
    type: "collapse",
    name: "Class Room",
    key: "class-room",
    icon: <SchoolTwoToneIcon />,
    route: "/class-room",
    component: <ClassroomListing />,
  },
];

export const DmsRoutes = [
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    icon: <DashboardIcon fontSize="small" />,
    route: "/dashboard",
    component: <Dashboard />,
  },
  {
    type: "collapse",
    name: "User Management",
    key: "user-listing",
    icon: <PersonAddIcon />,
    route: "/user-listing",
    component: <UsersListing />,
  },
  {
    type: "collapse",
    name: "Departments",
    key: "department-listing",
    icon: <ApartmentIcon />,
    route: "/department-listing",
    component: <DepartmentListing />,
  },
  {
    type: "collapse",
    name: "Documents",
    key: "document-listing",
    icon: <LibraryBooksIcon />,
    route: "/document-listing",
    component: <DocumentListing />,
  },
  {
    type: "collapse",
    name: "Workflows",
    key: "workflow-listing",
    icon: <WorkspacesIcon />,
    route: "/workflow-listing",
    component: <WorkflowListing />,
  },
  {
    type: "collapse",
    name: "Status Management",
    key: "status-list",
    icon: <SettingsIcon />,
    route: "/status-list",
    component: <StatusListing />,
  },
  {
    type: "collapse",
    name: "Document Types",
    key: "document-typelisting",
    icon: <AssignmentIcon />,
    route: "/document-typelisting",
    component: <DocumentTypesListing />,
  },
  {
    type: "collapse",
    name: "Templates",
    key: "template-listing",
    icon: <TopicIcon />,
    route: "/template-listing",
    component: <TemplateListing />,
  },
  // {
  //   type: "collapse",
  //   name: "Inventory",
  //   key: "inventory-list",
  //   icon: <Inventory2Icon />,
  //   route: "/inventory-list",
  //   component: <InventoryListing />,
  // },
  // {
  //   type: "collapse",
  //   name: "Archived",
  //   key: "archived-listing",
  //   icon: <ArchiveIcon />,
  //   route: "/archived-listing",
  //   component: <ArchivedListing />,
  // },
  // {
  //   type: "collapse",
  //   name: "Roles & Permissions",
  //   key: "roles-listing",
  //   icon: <SettingsIcon />,
  //   route: "/roles-listing",
  //   component: <RolesPermissionsListing />,
  // },
  {
    type: "collapse",
    name: "Print Approvals",
    key: "approval-listing",
    icon: <ApprovalIcon />,
    route: "/approval-listing",
    component: <PrintApprovalListing />,
  },
  {
    type: "collapse",
    name: "Printer",
    key: "printer-listing",
    icon: <LocalPrintshopIcon />,
    route: "printer-listing",
    component: <PrinterListing />,
  },
  // {
  //   type: "collapse",
  //   name: "Print Retrieval",
  //   key: "retrieval-listing",
  //   icon: <GetAppOutlinedIcon />,
  //   route: "/retrieval-listing",
  //   component: <PrintRetrievalListing />,
  // },
  {
    type: "collapse",
    name: "Doc  Revision Request",
    key: "revise-listing",
    icon: <ImportContactsTwoToneIcon />,
    route: "/revise-listing",
    component: <ReviseApprovalList />,
  },
];

export const DtcRoutes = [
  {
    type: "collapse",
    name: "LMS Dashboard",
    key: "lms-dashboard",
    icon: <DashboardIcon fontSize="small" />,
    route: "/lms-dashboard",
    component: <LMSDashboard />,
  },
  {
    type: "collapse",
    name: "User Management",
    key: "user-listing",
    icon: <PersonAddIcon />,
    route: "/user-listing",
    component: <UsersListing />,
  },
  {
    type: "collapse",
    name: "LMS  User Report",
    key: "user-reports",
    icon: <AssessmentOutlinedIcon />,
    route: "/user-reports",
    component: <UserReports />,
  },
  {
    type: "collapse",
    name: "Employee Workflow",
    key: "employee-workflow",
    icon: <AssignmentIndOutlinedIcon fontSize="small" />,
    route: "/employee-workflow",
    component: <ViewEmployeeStatus />,
  },
  {
    type: "collapse",
    name: "Plants",
    key: "plant-listing",
    icon: <FactoryTwoToneIcon />,
    route: "/plant-listing",
    component: <PlantListing />,
  },
  {
    type: "collapse",
    name: "Area",
    key: "area-listing",
    icon: <HomeMiniRoundedIcon />,
    route: "/area-listing",
    component: <AreaListing />,
  },
  {
    type: "collapse",
    name: "Methodology",
    key: "methodology-listing",
    icon: <AccountTreeIcon />,
    route: "/methodology-listing",
    component: <MethodologyListing />,
  },
  {
    type: "collapse",
    name: "Training Type",
    key: "trainingType-Listing",
    icon: <DevicesFoldTwoToneIcon />,
    route: "/trainingType-Listing",
    component: <TrainingTypeListing />,
  },
  {
    type: "collapse",
    name: "Induction Set",
    key: "induction-Listing",
    icon: <AccountTreeIcon />,
    route: "/induction-Listing",
    component: <InductionListing />,
  },
  {
    type: "collapse",
    name: "Training Activity",
    key: "trainingListing",
    icon: <ModelTrainingTwoToneIcon />,
    route: "/trainingListing",
    component: <TrainingListing />,
  },
  {
    type: "collapse",
    name: "Trainer ",
    key: "trainer-listing",
    icon: <Diversity1Icon />,
    route: "/trainer-listing",
    component: <TrainingListing />,
  },
  {
    type: "collapse",
    name: "Job Role",
    key: "jobRole-listing",
    icon: <WorkTwoToneIcon />,
    route: "/jobRole-listing",
    component: <JobroleListing />,
  },
  {
    type: "collapse",
    name: "Job Role Mapping",
    key: "trainingMapping-listing",
    icon: <ForkRightTwoToneIcon />,
    route: "/trainingMapping-listing",
    component: <TrainingMapping />,
  },
  {
    type: "collapse",
    name: "Training Mapping",
    key: "jobrole-mapping",
    icon: <DisplaySettingsRoundedIcon />,
    route: "/jobrole-mapping",
    component: <JobRoleMapping />,
  },
  {
    type: "collapse",
    name: "Class Room",
    key: "class-room",
    icon: <SchoolTwoToneIcon />,
    route: "/class-room",
    component: <ClassroomListing />,
  },
];

export default routes;
