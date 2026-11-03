import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from "constants/config";
import { withStatusCheck } from "services/baseQuery";

export const commentApi = createApi({
  reducerPath: "commentApi",
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
    // Create a new comment
    createComment: builder.mutation({
      query: ({ document, comment_description }) => ({
        url: "dms_module/create_comment",
        method: "POST",
        body: { document, comment_description },
      }),
      transformResponse: (response) => ({
        status: response.status,
        message: response.message,
      }),
    }),

    // View comments
    viewComments: builder.query({
      query: (documentId) => ({
        url: `dms_module/view_comment/${documentId}`, // Embed documentId in the path
        method: "GET",
      }),
      transformResponse: (response) => ({
        message: response.message,
        data: response.data.map((comment) => ({
          id: comment.id,
          user: comment.user,
          document: comment.document,
          commentDescription: comment.Comment_description,
          createdAt: comment.created_at,
        })),
      }),
    }),
  }),
});

export const {
  useCreateCommentMutation, // Hook for creating a comment
  useViewCommentsQuery,     // Hook for viewing comments
} = commentApi;
