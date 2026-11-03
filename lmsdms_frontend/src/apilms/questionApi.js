import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from 'constants/config';
import { withStatusCheck } from "services/baseQuery";

export const questionApi = createApi({
  reducerPath: 'questionApi',
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
    createTrainingQuestion: builder.mutation({
      query: (formData) => ({
        url: 'lms_module/create_training_questions',
        method: 'POST',
        body: formData, 
      }),
      transformResponse: (response) => response, 
    }),
    fetchTrainingQuestions: builder.query({
      query: () => ({
        url: 'lms_module/create_training_questions',
        method: 'GET',
      }),
      transformResponse: (response) => response, 
    }),
    updateTrainingQuestion: builder.mutation({
      query: ({ QuestionId, formData }) => ({
        url: `lms_module/update_training_questions/${QuestionId}`,
        method: 'PUT',
        body: formData, 
      }),
      transformResponse: (response) => response, 
    }),
    deleteTrainingQuestion: builder.mutation({
      query: ({ id }) => ({
        url: `lms_module/update_training_questions/${id}`,  
        method: 'DELETE', 
      }),
      transformResponse: (response) => response, 
    }),
    
      fetchTrainingWiseQuestions: builder.query({
        query: (training_id) => ({
          url: `lms_module/training_wise_questions/${training_id}`,
          method: 'GET',
        }),
        transformResponse: (response) => response,
      }),
      createTrainingQuiz: builder.query({
        query: () => ({
          url: 'lms_module/create_training_quiz', // No params or query added
          method: 'GET',
        }),
        transformResponse: (response) => response,
      }),
  }),
});

export const {
  useCreateTrainingQuestionMutation,
  useFetchTrainingQuestionsQuery,
  useUpdateTrainingQuestionMutation,
  useDeleteTrainingQuestionMutation,
  useFetchTrainingWiseQuestionsQuery,
  useCreateTrainingQuizQuery, 
} = questionApi;
