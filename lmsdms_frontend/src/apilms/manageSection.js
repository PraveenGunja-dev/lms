// src/apis/TrainingApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from 'constants/config';
import { withStatusCheck } from "services/baseQuery";

export const manageSection = createApi({
  reducerPath: 'manageSection',
  baseQuery: withStatusCheck(fetchBaseQuery({
    baseUrl: config.BACKEND_API_URL,
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  })),
  endpoints: (builder) => ({
    createSection: builder.mutation({
        query: (formData) => {
          return {
            url: 'lms_module/create_training_section/create_training',
            method: 'POST',
            body: formData,
          };
        },
        transformResponse: (response) => response,
      }),
    fetchSection: builder.query({
      query: () => ({
        url: 'lms_module/create_training_section/create_training',
        method: 'GET',
      }),
      transformResponse: (response) => response,
    }),
    updateSection: builder.mutation({
      query:  (formData) =>{
        return {
          url: `lms_module/update_training/${id}`,
          method: 'PUT',
          body: formData,
        };
      },
      transformResponse: (response) => response,
    }),
  }),
});

export const {
  useCreateSectionMutation,
  useFetchSectionQuery,
  useUpdateSectionMutation,
} = manageSection;
