// src/apis/plantApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from 'constants/config';
import { withStatusCheck } from "services/baseQuery";

export const inductionApi = createApi({
  reducerPath: 'inductionApi',
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

    createGetInduction: builder.mutation({
      query: (inductiondata) => ({
        url: 'lms_module/create_induction',
        method: 'POST',
        body: inductiondata,
      }),
      transformResponse: (response) => response,
    }),
    getInduction: builder.query({
      query: () => ({
        url: 'lms_module/create_induction',
        method: 'GET',
      }),
      transformResponse: (response) => response, // Handle raw response
    }),
    updateDeleteInduction: builder.mutation({
      query: (formData) => ({
        url: `lms_module/update_induction/${formData.get("induction_id")}`,
        method: 'PUT',
        body: formData,
      }),
      
        transformResponse: (response) => response, // Handle raw response
      }),

      createInductionDesignation: builder.mutation({
        query: ({ induction_designation_name, designation_code, induction }) => ({
          url: "lms_module/create_induction_designation",
          method: "POST",
          body: { induction_designation_name, designation_code, induction },
        }),
        transformResponse: (response) => response,
      }),
  }),
});

export const { 
  useCreateGetInductionMutation,
  useGetInductionQuery, // Hook for the create_get_plant GET API
  useUpdateDeleteInductionMutation,
  useCreateInductionDesignationMutation, 
} = inductionApi;
