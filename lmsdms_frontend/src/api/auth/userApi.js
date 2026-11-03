import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from "constants/config";
import { withStatusCheck } from "services/baseQuery";

export const userApi = createApi({
  reducerPath: "userApi",
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
  tagTypes: ["UserList"], // Define a tag for the user list data
  endpoints: (builder) => ({
    createUser: builder.mutation({
      query: (body) => ({
        url: "user_profile/user_create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["UserList"],
    }),
    updateUser: builder.mutation({
      query: (body) => ({
        url: `user_profile/user_update/${body.id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["UserList"],
    }),
    userList: builder.query({
      query: () => "user_profile/user_list",
      providesTags: ["UserList"],
    }),
    reviewerUsers: builder.query({
      query: () => "user_profile/reviewer_users",
      providesTags: ["UserList"],
    }),

    // Fetch approver users
    approverUsers: builder.query({
      query: () => "user_profile/approver_users",
      providesTags: ["UserList"],
    }),

    // Fetch document admin users
    docAdminUsers: builder.query({
      query: () => "user_profile/docadmin_users",
      providesTags: ["UserList"],
    }),
    failedUser: builder.query({
      query: (DocId) => `lms_module/failed_user/${DocId}`,
    }),
    userIdWiseNoOfAttempts: builder.mutation({
      query: (userId) => ({
        url: "lms_module/user_id_wise_no_of_attempts",
        method: "POST",
        body: { user_id: userId }, // Pass user_id in the body of the request
      }),
    }),
    userIdWiseResult: builder.query({
      query: ({ userId, documentId }) => `lms_module/user_id_wise_result/${userId}/${documentId}`,
    }),
    userIdWiseNoOfClassAttempts: builder.mutation({
      query: (userId) => ({
        url: "lms_module/classroom_user_id_wise_no_of_attempts",
        method: "POST",
        body: { user_id: userId },
      }),
    }),
    userIdWisewithout: builder.query({
      query: ({ userId }) => `lms_module/classroom_without_assesment/${userId}`,
    }),
    updateDocumentReviewers: builder.mutation({
      query: ({ document_id, reviewer_ids }) => ({
        url: `dms_module/update_document_reviewers/${document_id}`,
        method: "PUT",
        body: { reviewer_ids },
      }),
    }),
    jobDescriptionList: builder.query({
      query: (userId) => `lms_module/jobdescription_list/${userId}`,
    }),
  }),
});

export const {
  useCreateUserMutation,
  useUpdateUserMutation,
  useUserListQuery,
  useReviewerUsersQuery,
  useApproverUsersQuery,
  useDocAdminUsersQuery,
  useFailedUserQuery,
  useUserIdWiseNoOfAttemptsMutation,
  useUserIdWiseResultQuery,
  useUserIdWiseNoOfClassAttemptsMutation,
  useUserIdWisewithoutQuery,
  useUpdateDocumentReviewersMutation,
  useJobDescriptionListQuery,
} = userApi;
