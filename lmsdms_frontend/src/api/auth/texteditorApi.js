// src/apis/texteditorApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from "constants/config";
import { withStatusCheck } from "services/baseQuery";

export const texteditorApi = createApi({
  reducerPath: "texteditorApi",
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
    getTemplate: builder.query({
      query: (document_id) => ({
        url: `dms_module/GetTemplate/${document_id}`,
        method: "GET",
      }),
      transformResponse: (response) => response.data,
    }),
    createDocument: builder.mutation({
      query: ({ document_id, document_data }) => ({
        url: `dms_module/create_document_details`,
        method: "POST",
        body: { document_id, document_data },
      }),
      transformResponse: (response) => response.data,
    }),
    draftDocument: builder.mutation({
      query: ({ document_id, status_id }) => ({
        url: `dms_module/draft_document`,
        method: "PUT",
        body: { document_id, status_id },
      }),
      transformResponse: (response) => response,
    }),
    documentApproveStatus: builder.mutation({
      query: ({ document_id, documentdetails_id, status,remark,visible_to_users,approver,doc_admin }) => ({
        url: `dms_module/document_approve_status`,
        method: "POST",
        body: { document_id, documentdetails_id, status, remark,visible_to_users,approver,doc_admin },
      }),
      transformResponse: (response) => response,
    }),
    documentReviewStatus: builder.mutation({
      query: ({ document_id, status,remark }) => ({
        url: `dms_module/document_review_status`,
        method: "POST",
        body: { document_id, status,remark },
      }),
      transformResponse: (response) => response,
    }),
    documentApproverStatus: builder.mutation({
      query: ({ document_id, status,remark,visible_to_users,approver,doc_admin }) => ({
        url: `dms_module/document_approver_status`,
        method: "POST",
        body: { document_id, status, remark,visible_to_users,approver,doc_admin },
      }),
      transformResponse: (response) => response,
    }),
    documentDocadminStatus: builder.mutation({
      query: ({ document_id, status }) => ({
        url: `dms_module/document_docadmin_status`,
        method: "POST",
        body: { document_id, status },
      }),
      transformResponse: (response) => response,
    }),
    documentSendBackStatus: builder.mutation({
      query: ({ document_id , assigned_to,status_sendback,remark }) => ({
        url: `dms_module/document_send_back_status`,
        method: "POST",
        body: { document_id , assigned_to,status_sendback,remark },
      }),
      transformResponse: (response) => response,
    }),
    getApprovedStatusUsers: builder.query({
      query: (documentId) => ({
        url: `dms_module/approved_status_users/${documentId}`,  // Pass it as a query param
        method: "GET",
      }),
      transformResponse: (response) => response.data,
      refetchInterval: 3000,
    }),
    documentreleaseEffectiveStatus: builder.mutation({
      query: ({ document_id, status_id,effective_date,revision_date}) => ({
        url: `dms_module/document_release_effective_status`,
        method: "POST",
        body: { document_id, status_id ,effective_date,revision_date},
      }),
      transformResponse: (response) => response,
    }),
    getIdWiseDocumentList: builder.query({
      query: (documentId) => ({
        url: `dms_module/id_wise_document_list/${documentId}`,
        method: "GET",
      }),
    }),
  }),
});

export const { 
  useGetTemplateQuery,
  useCreateDocumentMutation,
  useDraftDocumentMutation,
  useDocumentApproveStatusMutation,
  useDocumentReviewStatusMutation,
  useDocumentApproverStatusMutation,
  useDocumentDocadminStatusMutation,
  useDocumentSendBackStatusMutation,
  useGetApprovedStatusUsersQuery,
  useDocumentreleaseEffectiveStatusMutation,
  useGetIdWiseDocumentListQuery
} = texteditorApi;
