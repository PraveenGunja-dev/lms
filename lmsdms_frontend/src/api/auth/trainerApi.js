import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from "constants/config";
import { withStatusCheck } from "services/baseQuery";

export const trainerApi = createApi({
  reducerPath: "trainerApi",
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
  tagTypes: ["Trainers"],
  endpoints: (builder) => ({
    trainerCreate: builder.mutation({
      query: ({ trainer_name, description, employee_code, designation, department }) => ({
        url: "lms_module/trainer_create",
        method: "POST",
        body: { trainer_name, description, employee_code, designation, department },
      }),
      transformResponse: (response) => {
        if (response.status) {
          return response;
        }
      },
      invalidatesTags: ["Trainers"],
    }),
    fetchTrainers: builder.query({
      query: () => ({
        url: "lms_module/trainer_create",
        method: "GET",
      }),
      transformResponse: (response) => {
        if (response.status) {
          return response.data;
        }
        throw new Error(response.message || "Failed to fetch trainers");
      },
      providesTags: ["Trainers"],
    }),
    trainerUpdate: builder.mutation({
      query: ({
        trainer_id,
        trainer_name,
        description,
        employee_code,
        designation,
        department,
      }) => ({
        url: `lms_module/trainer_update/${trainer_id}`,
        method: "PUT",
        body: {
          trainer_name, 
          description,
          employee_code,
          designation,
          department,
        },
      }),
      transformResponse: (response) => response,
    }),
    trainerActiveDeactive: builder.mutation({
      query: (trainer_id) => ({
        url: `lms_module/trainer_active_deactive/${trainer_id}`, // Trainer ID in URL path
        method: "PUT",
        // No request body, just passing the trainer_id
      }),
      transformResponse: (response) => {
        if (response.status) {
          return response.message;
        }
        throw new Error(response.message || "Failed to update trainer status");
      },
      invalidatesTags: ["Trainers"],
    }),
  }),
});

export const {
  useTrainerCreateMutation,
  useFetchTrainersQuery,
  useTrainerUpdateMutation,
  useTrainerActiveDeactiveMutation, // Export the new mutation hook
} = trainerApi;
