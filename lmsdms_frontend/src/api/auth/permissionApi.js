import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from 'constants/config';
import { withStatusCheck } from "services/baseQuery";

export const permissionApi = createApi({
    reducerPath: 'permissionApi',
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
        fetchPermissions: builder.query({
            query: () => 'user_profile/permission_list',
            transformResponse: (response) => {
                if (response.status) {
                    return response.data;
                }
                throw new Error(response.message || 'Failed to fetch permissions');
            },
        }),
        createGroupWithPermissions: builder.mutation({
            query: ({ name, permissions }) => ({
                url: 'user_profile/group_create_with_permissions',
                method: 'POST',
                body: { name, permissions },
            }),
        }),
        // New API to fetch permissions by group ID
        fetchPermissionsByGroupId: builder.query({
            query: (group_id) => {
            //   console.log("Group ID From API :-----------------=============", group_id); // Log the group_id
              return `user_profile/group_id_wise_permission_list?group_id=${group_id}`;
            },
            transformResponse: (response) => {
              if (response.status) {
                return response.data;
              }
              throw new Error(response.message || 'Failed to fetch permissions by group ID');
            },
          }),
          
       
        updateGroupPermissions: builder.mutation({
            query: ({ group_id, permissions,name }) => ({
                url: `user_profile/group_update_with_permissions/${group_id}`,
                method: 'PUT',
                body: { name ,permissions},
            }),
            transformResponse: (response) => {
                if (response.status) {
                    return response.message;
                }
                throw new Error(response.message || 'Failed to update group permissions');
            },
        }),
    }),
});

export const { 
    useFetchPermissionsQuery, 
    useCreateGroupWithPermissionsMutation, 
    useFetchPermissionsByGroupIdQuery, 
    useUpdateGroupPermissionsMutation 
} = permissionApi;
