import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from 'constants/config';
import { withStatusCheck } from "services/baseQuery";

export const userRoleApi = createApi({
  reducerPath: 'userRoleApi',
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
    
    switchUserRole: builder.mutation({
      query: ({ group_name, password }) => ({
        url: 'user_profile/UserSwitchRole',
        method: 'POST',
        body: { group_name, password },
      }),
    
      invalidatesTags: [{ type: 'UserRole', id: 'LIST' }],
      onQueryStarted: async ({ group_name, password }, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled; 
        
          dispatch(userRoleApi.util.invalidateTags([{ type: 'UserRole', id: 'LIST' }]));
        } catch (error) {
          console.error('Error switching user role:', error);
        }
      },
    }),

  
    fetchUserRole: builder.query({
      query: () => ({
        url: 'user_profile/UserRole',
        method: 'GET',
      }),
      providesTags: ['UserRole'],  
      transformResponse: (response) => response.data || {},
    }),
  }),
});

export const {
  useSwitchUserRoleMutation,
  useFetchUserRoleQuery,
} = userRoleApi;
