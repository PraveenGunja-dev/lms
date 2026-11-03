import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from 'constants/config';
import { withStatusCheck } from "services/baseQuery";

export const switchRoleApi = createApi({
  reducerPath: 'switchRoleApi',
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
  
    requestUserGroupList: builder.query({
      query: () => ({
        url: 'user_profile/requestuser_group_list',
        method: 'GET',
      }),
    }),

    userSwitchRole: builder.mutation({
      query: ({ group_id, password }) => ({
        url: 'user_profile/user_switch_role',
        method: 'POST',
        body: {
          group_id,
          password,
        },
      }),
    }),
  }),
});


export const { 
  useRequestUserGroupListQuery, 
  useUserSwitchRoleMutation 
} = switchRoleApi;
