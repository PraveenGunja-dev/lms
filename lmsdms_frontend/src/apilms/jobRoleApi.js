// src/apis/jobroleApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from "constants/config";
import { withStatusCheck } from "services/baseQuery";

export const jobroleApi = createApi({
  reducerPath: "jobroleApi",
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
    createJobRole: builder.mutation({
      query: ({ job_role_name, job_role_description, plant, area, department }) => ({
        url: "lms_module/create_get_job_role",
        method: "POST",
        body: { job_role_name, job_role_description, plant, area, department },
      }),
      transformResponse: (response) => response, // Handle raw response
    }),

    // GET method for retrieving job role data
    getJobRole: builder.query({
      query: () => ({
        url: "lms_module/create_get_job_role",
        method: "GET",
      }),
      transformResponse: (response) => response, // Handle raw response
    }),

    // PUT method for updating a job role
    updateJobRole: builder.mutation({
      query: ({ job_role_id, job_role_name, job_role_description }) => ({
        url: `lms_module/update_delete_job_role/${job_role_id}`,
        method: "PUT",
        body: { job_role_name, job_role_description },
      }),
      transformResponse: (response) => response, // Handle raw response
    }),
    createJobDescription: builder.mutation({
      query: ({ user_id, employee_job_description }) => ({
        url: "lms_module/jobdescriptioncreate",
        method: "POST",
        body: { user_id, employee_job_description },
      }),
      transformResponse: (response) => response, // Handle raw response
    }),
    getJobDescriptionList: builder.query({
      query: (userId) => ({
        url: `lms_module/jobdescription_list/${userId}`,
        method: "GET",
      }),
      transformResponse: (response) => response, // Handle raw response
    }),
    hodRemarks: builder.mutation({
      query: ({ currentUserId, user_id, status, remark, description }) => ({
        url: `lms_module/hod_remarks/${currentUserId}`, // Endpoint with user_id
        method: "PUT",
        body: { status, remark, description, user_id }, // Status to update (e.g., "approved")
      }),
      transformResponse: (response) => response, // Handle raw response
    }),
    saveDescription: builder.mutation({
      query: ({ user_id, employee_job_description }) => ({
        url: "lms_module/save_jobdescription",
        method: "PUT",
        body: { user_id, employee_job_description },
      }),
      transformErrorResponse: (response) => response,
    }),
  }),
});

export const {
  useCreateJobRoleMutation,
  useGetJobRoleQuery,
  useUpdateJobRoleMutation,
  useCreateJobDescriptionMutation,
  useGetJobDescriptionListQuery,
  useHodRemarksMutation,
  useSaveDescriptionMutation,
} = jobroleApi;
