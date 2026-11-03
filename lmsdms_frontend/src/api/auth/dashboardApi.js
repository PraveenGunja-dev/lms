import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from "constants/config";
import { withStatusCheck } from "services/baseQuery";

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery: withStatusCheck(fetchBaseQuery({
    baseUrl: config.BACKEND_API_URL,
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  })),
  endpoints: (builder) => ({
    getDashboardCounts: builder.query({
      query: () => "dms_module/DashboardCount",
      transformResponse: (response) => response.data,
    }),
    getDocumentDataOfStatusIdNine: builder.query({
      query: ({ departmentId, startDate, endDate }) =>
        `dms_module/document_data_of_status_id_nine?department_id=${departmentId}&start_date=${startDate}&end_date=${endDate}`,
      transformResponse: (response) => ({
        approvedata: response.data,
        dataCountapprove: response.data_count,
      }),
    }),
    getDocumentDataOfStatusIdTwo: builder.query({
      query: ({ departmentId, startDate, endDate }) =>
        `dms_module/document_data_of_status_id_two?department_id=${departmentId}&start_date=${startDate}&end_date=${endDate}`,
      transformResponse: (response) => ({
        saveDraftdata: response.data,
        dataCountsavedraft: response.data_count,
      }),
    }),
    getDocumentDataOfStatusIdThree: builder.query({
      query: ({ departmentId, startDate, endDate }) =>
        `dms_module/document_data_of_status_id_three?department_id=${departmentId}&start_date=${startDate}&end_date=${endDate}`,
      transformResponse: (response) => ({
        reviewdata: response.data,
        dataCountreview: response.data_count,
      }),
    }),
    getDocumentDataOfStatusIdEleven: builder.query({
      query: ({ departmentId, startDate, endDate }) =>
        `dms_module/document_data_of_status_id_eleven?department_id=${departmentId}&start_date=${startDate}&end_date=${endDate}`,
      transformResponse: (response) => ({
        rejectdata: response.data,
        dataCountreject: response.data_count,
      }),
    }),
    getDocumentDataOfStatusIdFour: builder.query({
      query: ({ departmentId, startDate, endDate }) =>
        `dms_module/document_data_of_status_id_four?department_id=${departmentId}&start_date=${startDate}&end_date=${endDate}`,
      transformResponse: (response) => ({
        approvedata: response.data,
        dataCountapproved: response.data_count,
      }),
    }),
    getDocumentDataOfStatusIdninty: builder.query({
      query: ({ departmentId, startDate, endDate }) =>
        `dms_module/document_ninty_days_data?department_id=${departmentId}&start_date=${startDate}&end_date=${endDate}`,
      transformResponse: (response) => ({
        SOPdata: response.data,
        dataCountSOP: response.data_count,
      }),
    }),
    getDashboardDocument: builder.query({
      query: (id) => `lms_module/dashboard_document/${id}`,
      transformResponse: (response) => ({
        totalAssignDocument: response.total_assign_document,
        failedDocument: response.failed_document,
        passedDocument: response.passed_document,
      }),
    }),
    getPrintRejectDocumentData: builder.query({
      query: () => `dms_module/print_reject_document_data`,
      transformResponse: (response) => ({
        printRejectData: response.data,
        dataCount: response.data_count || 0,
        status: response.status,
        message: response.message,
      }),
    }),
    getDocumentVersionCount: builder.query({
      query: () => `dms_module/document_archived_count`, 
      transformResponse: (response) => ({
        status: response.status,
        message: response.message,
        totalCount: response.total_count,
      }),
    }),
  }),
});
 
export const {
  useGetDashboardCountsQuery,
  useGetDocumentDataOfStatusIdNineQuery,
  useGetDocumentDataOfStatusIdTwoQuery,
  useGetDocumentDataOfStatusIdThreeQuery,
  useGetDocumentDataOfStatusIdElevenQuery,
  useGetDocumentDataOfStatusIdFourQuery,
  useGetDocumentDataOfStatusIdnintyQuery,
  useGetDashboardDocumentQuery,
  useGetPrintRejectDocumentDataQuery,
  useGetDocumentVersionCountQuery,
} = dashboardApi;
