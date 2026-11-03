// src/apis/MethodologyApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from 'constants/config';
import { withStatusCheck } from "services/baseQuery";

export const methodologyApi = createApi({
  reducerPath: 'methodologyApi',
  baseQuery: withStatusCheck(fetchBaseQuery({
    baseUrl: config.BACKEND_API_URL,
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  })),
  endpoints: (builder) => ({
    // POST method for creating a methodology
    createMethodology: builder.mutation({
      query: ({ methodology_name }) => ({
        url: 'lms_module/create_methodology',
        method: 'POST',
        body: { methodology_name }, 
      }),
      transformResponse: (response) => response, // Handle raw response
    }),
    fetchMethodologies: builder.query({
        query: () => ({
          url: 'lms_module/create_methodology',
          method: 'GET',
        }),
        transformResponse: (response) => response, // Handle raw response
      }),
      updateMethodology: builder.mutation({
        query: ({ id, methodology_name }) => ({
          url: `lms_module/update_methodology/${id}`,
          method: 'PUT',
          body: { methodology_name },
        }),
        transformResponse: (response) => response, // Handle raw response
      }),
  }),
});

export const { 
  useCreateMethodologyMutation, // Hook for the create_methodology POST API
  useFetchMethodologiesQuery,
  useUpdateMethodologyMutation,
} = methodologyApi;
