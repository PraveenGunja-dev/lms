import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from 'constants/config';
import { withStatusCheck } from "services/baseQuery";

export const statusApi = createApi({
  reducerPath: 'statusApi',
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
  tagTypes: ['Status'], // Define a tag type for status data
  endpoints: (builder) => ({
    // Mutation to create a new status
    createStatus: builder.mutation({
      query: (status) => ({
        url: 'dms_module/create_status',
        method: 'POST',
        body: { status },
      }),
      // Invalidate the cache for the status list after creation
      invalidatesTags: [{ type: 'Status', id: 'LIST' }],
      onQueryStarted: async (status, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled; // Wait for the mutation to complete
          // Invalidate and refetch the status list after creating a new status
          dispatch(statusApi.util.invalidateTags([{ type: 'Status', id: 'LIST' }]));
        } catch (error) {
          console.error('Error creating status:', error);
        }
      },
    }),

    // Mutation to update an existing status
    updateStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `dms_module/update_status/${id}`,  // Assuming PUT method for updating
        method: 'PUT',
        body: { status },
      }),
      // Invalidate the cache for the status list after update
      invalidatesTags: [{ type: 'Status', id: 'LIST' }],
      onQueryStarted: async ({ id, status }, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;  // Wait for the mutation to complete
          // Invalidate and refetch the status list after updating
          dispatch(statusApi.util.invalidateTags([{ type: 'Status', id: 'LIST' }]));
        } catch (error) {
          console.error('Error updating status:', error);
        }
      },
    }),

    // Query to fetch all statuses
    viewStatus: builder.query({
      query: () => ({
        url: 'dms_module/view_status',
        method: 'GET',
      }),
      // Tagging the response data with 'Status' so that it can be invalidated later
      providesTags: [{ type: 'Status', id: 'LIST' }],
      transformResponse: (response) => response.data || [],  // Return an empty array if no data is available
    }),

    // Mutation to delete an existing status
    deleteStatus: builder.mutation({
      query: (id) => ({
        url: `dms_module/delete_status/${id}`,
        method: 'DELETE',
      }),
      // Invalidate the cache for the status list after deletion
      invalidatesTags: [{ type: 'Status', id: 'LIST' }],
      onQueryStarted: async (id, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled; // Wait for the mutation to complete
          // Invalidate and refetch the status list after deletion
          dispatch(statusApi.util.invalidateTags([{ type: 'Status', id: 'LIST' }]));
        } catch (error) {
          console.error('Error deleting status:', error);
        }
      },
    }),
  }),
});

export const { 
  useCreateStatusMutation, 
  useUpdateStatusMutation, 
  useViewStatusQuery, 
  useDeleteStatusMutation 
} = statusApi;
