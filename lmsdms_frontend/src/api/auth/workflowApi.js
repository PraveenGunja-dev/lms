import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from 'constants/config';
import { withStatusCheck } from "services/baseQuery";

export const workflowApi = createApi({
    reducerPath: 'workflowApi',
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
    tagTypes: ['Workflow'], // Define a tag type for workflow data
    endpoints: (builder) => ({
        // Mutation to create a new workflow
        createWorkflow: builder.mutation({
            query: (body) => ({
                url: 'dms_module/create_get_workflow',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Workflow', id: 'LIST' }], // Invalidate the workflow list cache after creation
        }),

        // Query to fetch all workflows
        fetchWorkflows: builder.query({
            query: () => 'dms_module/create_get_workflow',
            providesTags: [{ type: 'Workflow', id: 'LIST' }], // Tag the response data for workflow list
            transformResponse: (response) => {
                if (response.status) {
                    return response.data;
                }
                throw new Error(response.message || 'Failed to fetch workflows');
            },
        }),

        // Mutation to update an existing workflow
        updateWorkflow: builder.mutation({
            query: ({ workflow_id, workflow_name, workflow_description }) => ({
                url: `dms_module/update_delete_workflow/${workflow_id}`,
                method: 'PUT',
                body: { workflow_name, workflow_description },
            }),
            invalidatesTags: [{ type: 'Workflow', id: 'LIST' }], // Invalidate the workflow list cache after update
        }),
    }),
});

export const { useCreateWorkflowMutation, useFetchWorkflowsQuery, useUpdateWorkflowMutation } = workflowApi;
