import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from 'constants/config';
import { withStatusCheck } from "services/baseQuery";

export const archivedListApi = createApi({
    reducerPath: 'archivedListApi',
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
    tagTypes: ['Archived'], 
    endpoints: (builder) => ({
     
        fetchArchivedItems: builder.query({
            query: () => 'dms_module/archived_list',
            providesTags: [{ type: 'Archived', id: 'LIST' }], 
            transformResponse: (response) => {
                if (response.status) {
                    return response.data;
                }
                throw new Error(response.message || 'Failed to fetch archived items');
            },
        }),
    }),
});

export const { useFetchArchivedItemsQuery } = archivedListApi;