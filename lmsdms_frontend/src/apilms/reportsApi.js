// src/apis/lmsReportsAPI.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from 'constants/config';
import { withStatusCheck } from "services/baseQuery";

export const lmsReportsAPI = createApi({
  reducerPath: 'lmsReportsAPI',
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
    // GET method to fetch employee list based on employee ID
    getEmployeeJobRoleReport: builder.query({
      query: (employee_id) => ({
        url: `dms_module/employee_list/${employee_id}`,
        method: 'GET',
      }),
      transformResponse: (response) => response, // Handle raw response
    }),
    // GET method to fetch employee training need identification by employee ID
    getEmployeeTrainingNeedIdentification: builder.query({
      query: (employee_id) => ({
        url: `dms_module/employee_training_need_identy/${employee_id}`,
        method: 'GET',
      }),
      transformResponse: (response) => response,
    }),
    getTrainingAttendanceSheet: builder.query({
      query: (document_id) => ({
        url: `lms_module/training_attendance_sheet/${document_id}`,
        method: 'GET',
      }),
      transformResponse: (response) => response, 
    }),

    getEmployeeTrainingExcel: builder.query({
      query: () => ({
        url: `lms_module/employee_training_excel/`, 
        method: 'GET',
      }),
      transformResponse: (response) => response, // Return raw response
    }),
    getemployeeRecordlog:builder.query({
      query:()=>({
        url:`dms_module/employee_record_log`,
      }),
      transformResponse:(response)=>response,
    }),
    getTrainingAttendanceClassSheet: builder.query({
      query: (document_id) => ({
        url: `lms_module/classroom_training_attendance_sheet/${document_id}`,
        method: 'GET',
      }),
      transformResponse: (response) => response, 
    }),
  }),
});

export const {
  useGetEmployeeJobRoleReportQuery,
 useGetEmployeeTrainingNeedIdentificationQuery,
 useGetTrainingAttendanceSheetQuery,
 useGetEmployeeTrainingExcelQuery,
 useGetemployeeRecordlogQuery,
 useGetTrainingAttendanceClassSheetQuery,
} = lmsReportsAPI;
