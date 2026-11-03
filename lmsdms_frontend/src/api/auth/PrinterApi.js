import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from 'constants/config';
import { withStatusCheck } from "services/baseQuery";

export const printerApi = createApi({
  reducerPath: 'printerApi',
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
  tagTypes: ['Printer'], // Define a tag type for printer data
  endpoints: (builder) => ({
    // Mutation to create a new printer
    createPrinter: builder.mutation({
      query: ({ printer_name, printer_location }) => ({
        url: 'dms_module/create_printer',
        method: 'POST',
        body: { printer_name, printer_location },
      }),
      invalidatesTags: [{ type: 'Printer', id: 'LIST' }],
      onQueryStarted: async ({ printer_name, printer_location }, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
          dispatch(printerApi.util.invalidateTags([{ type: 'Printer', id: 'LIST' }]));
        } catch (error) {
          console.error('Error creating printer:', error);
        }
      },
    }),

    // Query to fetch all printers (updated to integrate the get_printer API)
    getPrinters: builder.query({
      query: () => ({
        url: 'dms_module/get_printer',  // The route to fetch printers
        method: 'GET',
      }),
      providesTags: [{ type: 'Printer', id: 'LIST' }],
      transformResponse: (response) => response.data || [], // Adjusted to match response structure
    }),

    // Mutation to update an existing printer
    updatePrinter: builder.mutation({
      query: ({ printer_id, printer_name, printer_location }) => ({
        url: `dms_module/update_Printer/${printer_id}`,
        method: 'PUT',
        body: { printer_name, printer_location },
      }),
      invalidatesTags: [{ type: 'Printer', id: 'LIST' }],
      onQueryStarted: async ({ printer_id, printer_name, printer_location }, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
          dispatch(printerApi.util.invalidateTags([{ type: 'Printer', id: 'LIST' }]));
        } catch (error) {
          console.error('Error updating printer:', error);
        }
      },
    }),
  }),
});

export const { 
  useCreatePrinterMutation, 
  useGetPrintersQuery,  // Renamed hook to match new query name
  useUpdatePrinterMutation 
} = printerApi;
