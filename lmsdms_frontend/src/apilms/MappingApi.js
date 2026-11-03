import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from "constants/config";
import { withStatusCheck } from "services/baseQuery";

export const trainingMappingApi = createApi({
  reducerPath: "trainingMappingApi",
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
  
   
    jobroleAssignTraining: builder.mutation({
      query: ({ user_id, job_role_ids }) => ({
        url: `lms_module/jobrole_assign_training/${user_id}`, 
        method: "PUT",
        body: {
          job_role_ids, 
        },
      }),
      transformResponse: (response) => response, 
    }),
    trainingAssignJobrole: builder.query({
      query: (job_role_id) => ({
        url: `lms_module/training_assign_jobrole?job_role_id=${job_role_id}`,
        method: "GET",
      }),
      transformResponse: (response) => response,
    }),
    trainingAssignJobroleMutation: builder.mutation({
      query: ({ job_role_id, document_ids }) => ({
        url: `lms_module/training_assign_jobrole`,
        method: "POST",  // Using POST method for creating assignments
        body: {
          job_role_id,
          document_ids,
        },
      }),
      transformResponse: (response) => response,
    }),
    jobroleAssignTrainingList: builder.query({
      query: (user_id) => ({
        url: `lms_module/jobrole_assign_training_list/${user_id}`,
        method: "GET",
      }),
      transformResponse: (response) => response,
    }),
  }),
});

export const {
  useJobroleAssignTrainingMutation,
  useTrainingAssignJobroleQuery,
  useTrainingAssignJobroleMutationMutation,
  useJobroleAssignTrainingListQuery,
} = trainingMappingApi;
