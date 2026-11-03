import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from "constants/config";
import { withStatusCheck } from "services/baseQuery";

export const editDocumentApi = createApi({
  reducerPath: "editDocumentApi",
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
    // Fetch document details by document_id
    fetchDocumentDetails: builder.query({
      query: (document_id) => ({
        url: `dms_module/document_details_id/${document_id}`,
        method: "GET",
      }),
      transformResponse: (response) => response.data,
    }),

    // Update document
    updateDocument: builder.mutation({
      query: (documentData) => ({
        url: `dms_module/update_document/${documentData.document_id}`, // use document_id from the documentData
        method: "PUT",
        body: documentData, // directly pass the plain object
        headers: {
          "Content-Type": "application/json", // Ensure Content-Type is set to application/json
        },
      }),
    }),
    addPathUrlDataForComments: builder.mutation({
      query: (commentData) => ({
        url: "dms_module/add_path_url_data_for_comments",
        method: "POST",
        body: commentData,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    }),
    
  }),
});

export const {
  useFetchDocumentDetailsQuery,
  useUpdateDocumentMutation,
  useAddPathUrlDataForCommentsMutation
  // Export the mutation hook
} = editDocumentApi;
