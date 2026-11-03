import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from "constants/config"; // Ensure this file has the correct BACKEND_API_URL
import { withStatusCheck } from "services/baseQuery";

export const retrievalApi = createApi({
  reducerPath: "retrievalApi",
  baseQuery: withStatusCheck(fetchBaseQuery({
    baseUrl: config.BACKEND_API_URL,
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  })),
  endpoints: (builder) => ({
    getApprovedPrintList: builder.query({
      query: () => ({
        url: "dms_module/get_approved_print_list", // Your API endpoint
        method: "GET",
      }),
      transformResponse: (response) => response.data, // Extract the 'data' array from the response
    }),
    getPrintApprovalDetails: builder.query({
      query: (id) => ({
        url: `dms_module/print_approval/${id}`, // Dynamic URL with ID
        method: "GET",
      }),
      transformResponse: (response) => response, // Return full response
    }),
    addRetrivalNumbers: builder.mutation({
      query: ({ print_request_approval_id, retrival_numbers }) => ({
        url: "dms_module/retrival_numbers",
        method: "POST",
        body: {
          print_request_approval_id,
          retrival_numbers,
        },
      }),
    }),
    getPrintRetrival: builder.query({
      query: (print_request_approval_id) => ({
        url: `dms_module/print_retrival/${print_request_approval_id}`, // Dynamic URL with ID
        method: "GET",
      }),
      transformResponse: (response) => response, // Return the full response as needed
    }),
  }),
});

export const {
  useGetApprovedPrintListQuery,
  useGetPrintApprovalDetailsQuery,
  useAddRetrivalNumbersMutation,
  useGetPrintRetrivalQuery, 
} = retrievalApi;
