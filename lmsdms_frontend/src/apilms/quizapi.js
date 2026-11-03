import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from 'constants/config';
import { withStatusCheck } from "services/baseQuery";

export const quizapi = createApi({
  reducerPath: 'quizapi',
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
    // POST method for creating a quiz
    createTrainingQuiz: builder.mutation({
      query: ({
        document_id,
        name,
        pass_criteria,
        quiz_time,
        quiz_type,
        total_marks,
        marks_breakdown,
        selected_questions,
      }) => ({
        url: 'lms_module/create_training_quiz',
        method: 'POST',
        body: {
          document_id,
          name,
          pass_criteria,
          quiz_time,
          quiz_type,
          total_marks,
          marks_breakdown,
          selected_questions,
        },
      }),
      transformResponse: (response) => response, // Handle raw response
    }),

    // GET method for retrieving quizzes
    getTrainingQuizzes: builder.query({
      query: (id) => ({
        url: `lms_module/list_training_quiz/${id}`, // Include the ID in the URL
        method: 'GET',
      }),
      transformResponse: (response) => response, // Handle raw response
    }),
    // Put method for editing quiz:
    updateTrainingQuiz: builder.mutation({
      query: ({
        quiz_id,
        name,
        pass_criteria,
        quiz_time,
        quiz_type,
        total_marks,
        marks_breakdown,
        selected_questions,
      }) => ({
        url: `lms_module/update_training_quiz/${quiz_id}`, // URL with quiz_id
        method: 'PUT',
        body: {
          name,
          pass_criteria,
          quiz_time,
          quiz_type,
          total_marks,
          marks_breakdown,
          selected_questions,
        },
      }),
      transformResponse: (response) => response, // Handle raw response
    }),

    // PUT method for updating or deleting a quiz
    updateDeleteQuiz: builder.mutation({
      query: ({
        quiz_id,
        training_id,
        name,
        pass_criteria,
        quiz_time,
        quiz_type,
        total_marks,
        marks_breakdown,
        selected_questions,
      }) => ({
        url: `lms_module/update_delete_quiz/${quiz_id}`,
        method: 'PUT',
        body: {
          training_id,
          name,
          pass_criteria,
          quiz_time,
          quiz_type,
          total_marks,
          marks_breakdown,
          selected_questions,
        },
      }),
      transformResponse: (response) => response, // Handle raw response
    }),
    attemptQuiz: builder.mutation({
      query: (quizPayload) => ({
        url: 'lms_module/attempted_quiz',
        method: 'POST',
        body: quizPayload,
      }),
      transformResponse: (response) => response, // Handle raw response
    }),
    startAttemptQuiz: builder.mutation({
      query: (quizPayload) => ({
        url: 'lms_module/once_training_attempted',
        method: 'PUT',
        body: quizPayload,
      }),
      transformResponse: (response) => response,
    }),
    toggleUserTraining: builder.mutation({
      query: (payload) => ({
        url: 'lms_module/on_off_user_for_training',
        method: 'PUT',
        body: payload, // Directly sending the object
      }),
      transformResponse: (response) => response,
    }),
  }),
});

export const {
  useCreateTrainingQuizMutation, // Hook for the create_training_quiz POST API
  useGetTrainingQuizzesQuery,    // Hook for the create_training_quiz GET API
  useUpdateTrainingQuizMutation,
  useUpdateDeleteQuizMutation,
  useAttemptQuizMutation,
  useStartAttemptQuizMutation,
  useToggleUserTrainingMutation
} = quizapi;
