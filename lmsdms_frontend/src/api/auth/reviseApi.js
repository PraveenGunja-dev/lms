import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from "constants/config";
import { withStatusCheck } from "services/baseQuery";

export const reviseApi = createApi({
  reducerPath: "reviseApi",
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
    reviseRequest: builder.mutation({
      query: ({ document_id, revise_description }) => ({
        url: "dms_module/revise_request",
        method: "POST",
        body: { document_id, revise_description },
      }),
      transformResponse: (response) => response.data,
    }), 
    reviseRequestGet: builder.query({
      query: () => ({
        url: "dms_module/revise_request_get",
        method: "GET",
      }),
      transformResponse: (response) => response, // Extract the data from the API response
    }),
    approveRevise: builder.mutation({
      query: ({ document_id, status_id, request_action_id, action_status,remarks }) => ({
        url: "dms_module/approve_revise",
        method: "POST",
        body: { document_id, status_id, request_action_id, action_status,remarks },
      }),
      transformResponse: (response) => response, // Assuming the response is the status and message object
    }),
  }),
});

export const { useReviseRequestMutation, useReviseRequestGetQuery,useApproveReviseMutation } = reviseApi;
