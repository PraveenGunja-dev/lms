// src/apis/TrainingTypeApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from 'constants/config';
import { withStatusCheck } from "services/baseQuery";

export const trainingTypeApi = createApi({
  reducerPath: 'trainingTypeApi',
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
    createTrainingType: builder.mutation({
      query: ({ training_type_name }) => ({
        url: 'lms_module/create_training_type',
        method: 'POST',
        body: { training_type_name },
      }),
      transformResponse: (response) => response, 
    }),
    fetchTrainingTypes: builder.query({
        query: () => ({
          url: 'lms_module/create_training_type',
          method: 'GET',
        }),
        transformResponse: (response) => response, // Handle raw response
      }),
      updateTrainingType: builder.mutation({
        query: ({ id, training_type_name }) => ({
          url: `lms_module/update_training_type/${id}`,
          method: 'PUT',
          body: { training_type_name },
        }),
        transformResponse: (response) => response,
      }),
  }),
});

export const { 
  useCreateTrainingTypeMutation,
  useFetchTrainingTypesQuery,
  useUpdateTrainingTypeMutation,
} = trainingTypeApi;
