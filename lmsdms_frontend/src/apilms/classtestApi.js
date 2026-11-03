// src/apis/classtestApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from "constants/config";
import { withStatusCheck } from "services/baseQuery";

export const classtestApi = createApi({
  reducerPath: "classtestApi",
  baseQuery: withStatusCheck(fetchBaseQuery({
    baseUrl: config.BACKEND_API_URL,
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      // headers.set("Content-Type", "application/json");
      return headers;
    },
  })),
  endpoints: (builder) => ({
    classroomQuestionsPost: builder.mutation({
      query: (dataForm) => ({
        url: "lms_module/classroom_questions",
        method: "POST",
        body: dataForm,
      }),
      transformResponse: (response) => response,
    }),
    classroomQuestionsGet: builder.query({
      query: (classroom_id) => ({
        url: `lms_module/classroom_id_wise_question/${classroom_id}`,
        method: "GET",
      }),
      transformResponse: (response) => response,
    }),
    classroomQuizPost: builder.mutation({
      query: (quizData) => ({
        url: "lms_module/classroom_quiz",
        method: "POST",
        body: quizData,
      }),
      transformResponse: (response) => response,
    }),
    classroomQuizGet: builder.query({
      query: (classroom_id) => ({
        url: `lms_module/list_classroom_quiz/${classroom_id}`,
        method: "GET",
      }),
      transformResponse: (response) => response,
    }),
    classroomQuizEdit: builder.mutation({
      query: (quizData) => ({
        url: `lms_module/classroom_quiz_update/${quizData.id}`,
        method: "PUT",
        body: quizData,
        }),
        transformResponse: (response) => response,
      }),
    classroomAttemptQuiz: builder.mutation({
        query: (quizPayload) => ({
          url: 'lms_module/classroom_attempted_quiz',
          method: 'POST',
          body: quizPayload,
        }),
        transformResponse: (response) => response,
      }),
    classroomStartAttemptQuiz: builder.mutation({
        query: (quizPayload) => ({
          url: 'lms_module/once_classroom_attempted',
          method: 'PUT',
          body: quizPayload,
        }),
        transformResponse: (response) => response,
     }),
  }),
});

export const {
  useClassroomQuestionsPostMutation,
  useClassroomQuestionsGetQuery,
  useClassroomQuizPostMutation,
  useClassroomQuizGetQuery,
  useClassroomQuizEditMutation,
  useClassroomAttemptQuizMutation,
  useClassroomStartAttemptQuizMutation 
} = classtestApi;
