// src/apis/plantApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from 'constants/config';
import { withStatusCheck } from "services/baseQuery";

export const plantApi = createApi({
  reducerPath: 'plantApi',
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
    // POST method for creating a plant
    createGetPlant: builder.mutation({
      query: ({ plant_name, plant_location, plant_description }) => ({
        url: 'lms_module/create_get_plant',
        method: 'POST',
        body: { plant_name, plant_location, plant_description },
      }),
      transformResponse: (response) => response, // Handle raw response
    }),

    // GET method for retrieving plant data
    getPlant: builder.query({
      query: () => ({
        url: 'lms_module/create_get_plant',
        method: 'GET',
      }),
      transformResponse: (response) => response, // Handle raw response
    }),
    updateDeletePlant: builder.mutation({
        query: ({ plant_id, plant_name, plant_location, plant_description }) => ({
          url: `lms_module/update_delete_plant/${plant_id}`,
          method: 'PUT',
          body: { plant_name, plant_location, plant_description },
        }),
        transformResponse: (response) => response, // Handle raw response
      }),
  }),
});

export const { 
  useCreateGetPlantMutation, // Hook for the create_get_plant POST API
  useGetPlantQuery, // Hook for the create_get_plant GET API
  useUpdateDeletePlantMutation ,
} = plantApi;
