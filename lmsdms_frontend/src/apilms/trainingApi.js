// src/apis/TrainingApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from 'constants/config';
import { withStatusCheck } from "services/baseQuery";

export const trainingApi = createApi({
  reducerPath: 'trainingApi',
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
    createTraining: builder.mutation({
        query: (formData) => {
          return {
            url: 'lms_module/create_training',
            method: 'POST',
            body: formData, // Directly pass the formData received from AddTraining
          };
        },
        transformResponse: (response) => response, // Handle raw response
      }),
      
    fetchTrainings: builder.query({
      query: () => ({
        url: 'lms_module/create_training',
        method: 'GET',
      }),
      transformResponse: (response) => response, // Handle raw response
    }),
    updateTraining: builder.mutation({
      query:  (formData) =>{

        return {
          url: `lms_module/update_training/${id}`,
          method: 'PUT',
          body: formData,
        };
      },
      transformResponse: (response) => response,
    }),
    completeViewDocument: builder.mutation({
      query: (data) => ({
        url: 'lms_module/user_complete_view_document',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response) => response,
    }),
    fetchTrainingWiseUsers: builder.query({
      query: (documentId) => ({
        url: `lms_module/training_wise_users?document_id=${documentId}`,
        // training_wise_users?document_id=1
        method: 'GET',
      }),
      transformResponse: (response) => response,
    }),
    fetchTrainingWithQuiz: builder.query({
      query: () => ({
        url: `lms_module/training_has_quiz_list`,
        // training_wise_users?document_id=1
        method: 'GET',
      }),
      transformResponse: (response) => response,
    }),
    fetchDocumentpendingReport: builder.query({
      query: ({ documentId }) => ({
        url: `lms_module/training_report_pending_completed/${documentId}`,
        method: "GET",
      }),
      transformResponse: (response) => response,  
    }),
    lazyFetchDocumentpendingReport: builder.query({
      query: ({ documentId }) => `lms_module/training_report_pending_completed/${documentId}`
    })
  }),
});

export const {
  useCreateTrainingMutation,
  useFetchTrainingsQuery,
  useUpdateTrainingMutation,
  useCompleteViewDocumentMutation,
  useFetchTrainingWiseUsersQuery,
  useFetchTrainingWithQuizQuery,
  useFetchDocumentpendingReportQuery,
  useLazyFetchDocumentpendingReportQuery 
} = trainingApi;
