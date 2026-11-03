// src/apis/areaApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from "constants/config";
import { withStatusCheck } from "services/baseQuery";

export const areaApi = createApi({
  reducerPath: "areaApi",
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
    // POST method for creating an area
    createGetArea: builder.mutation({
      query: ({ area_name, department_id, area_description }) => ({
        url: "lms_module/create_get_area",
        method: "POST",
        body: { area_name, department_id, area_description },
      }),
      transformResponse: (response) => response, // Handle raw response
    }),

    // GET method for retrieving area data
    getArea: builder.query({
      query: () => ({
        url: "lms_module/create_get_area",
        method: "GET",
      }),
      transformResponse: (response) => response, // Handle raw response
    }),

    // PUT method for updating or deleting an area
    updateDeleteArea: builder.mutation({
      query: ({ id, area_name, department_id, area_description }) => ({
        url: `lms_module/update_delete_area/${id}`,
        method: "PUT",
        body: { area_name, department_id, area_description },
      }),
      transformResponse: (response) => response, // Handle raw response
    }),
  }),
});

export const {
  useCreateGetAreaMutation, // Hook for the create_get_area POST API
  useGetAreaQuery, // Hook for the create_get_area GET API
  useUpdateDeleteAreaMutation,
} = areaApi;
