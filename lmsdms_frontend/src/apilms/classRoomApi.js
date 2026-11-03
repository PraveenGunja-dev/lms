import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from 'constants/config';
import { withStatusCheck } from "services/baseQuery";

// Define the classRoomApi
export const classRoomApi = createApi({
  reducerPath: 'classRoomApi',
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
    createClassroom: builder.mutation({
        query: (formData) => ({
          url: 'lms_module/create_classroom',
          method: 'POST',
          body: formData, // Send the FormData object directly
        }),
        transformResponse: (response) => response,
      }),
      
    // GET method for retrieving classroom data
    getClassrooms: builder.query({
      query: () => ({
        url: 'lms_module/create_classroom', 
        method: 'GET',
      }),
      transformResponse: (response) => response, 
    }),

    // PUT method for updating a classroom
    updateClassroom: builder.mutation({
      query: ({ id, classroom_name, is_assesment, description, upload_doc, status }) => ({
        url: `lms_module/update_classroom/${id}`,
        method: 'PUT',
        body: { classroom_name, is_assesment, description, upload_doc, status },
      }),
      transformResponse: (response) => response, 
    }),
    createSession: builder.mutation({
      query: (sessionData) => ({
        url: 'lms_module/create_session',
        method: 'POST',
        body: sessionData,
      }),
      transformResponse: (response) => response,
    }),
    getSessions: builder.query({
      query: (classroomId) => ({
        url: `lms_module/create_session?classroom_id=${classroomId}`,
        method: 'GET',
      }),
      transformResponse: (response) => response,
    }),
    markSessionCompleted: builder.mutation({
      query: (sessionId) => ({
        url: `lms_module/session_completed/${sessionId}`,
        method: 'POST', // Typically, this would be a POST request to mark something as completed
      }),
      transformResponse: (response) => response,
    }),
    updateSession: builder.mutation({
      query: ({ sessionId, sessionData }) => ({
        url: `lms_module/update_session/${sessionId}/`,  // Dynamically insert sessionId into the URL
        method: 'PUT',
        body: sessionData, // Session data like name, venue, etc.
      }),
      transformResponse: (response) => response,
    }),
    createAttendance: builder.mutation({
      query: ({ session_id, user_ids, status }) => ({
        url: 'lms_module/attendance',
        method: 'POST',
        body: { session_id, user_ids, status },
      }),
      transformResponse: (response) => response,
    }),
    getAttendance: builder.query({
      query: (sessionId) => ({
        url: `lms_module/attendance?session_id=${sessionId}`,
        method: 'GET',
      }),
      transformResponse: (response) => response.data, 
    }),
      getselecteduser:builder.query({
      query: (classroom_id) => ({
        url:`lms_module/classroom_wise_selected_user/${classroom_id}`,
        method: 'GET',
    }),
    transformResponse: (response) => response.data,
  }),
  updateClassroomPreview: builder.mutation({
    query: ({ classroom_id, is_preview }) => ({
      url: `lms_module/classroom_is_preview/${classroom_id}`,
      method: 'PUT',
      body: { is_preview },
    }),
    transformResponse: (response) => response,
  }), 
  }),
});
export const { 
  useCreateClassroomMutation,     
  useGetClassroomsQuery,          
  useUpdateClassroomMutation, 
  useCreateSessionMutation,
  useGetSessionsQuery,   
  useMarkSessionCompletedMutation,
  useUpdateSessionMutation,
  useCreateAttendanceMutation,
  useGetAttendanceQuery,
  useGetselecteduserQuery,
  useUpdateClassroomPreviewMutation
} = classRoomApi;
