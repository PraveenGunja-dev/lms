// src/api/esignatureApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from 'constants/config';
import { withStatusCheck } from "services/baseQuery";

export const esignatureApi = createApi({
    reducerPath: 'esignatureApi',
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
        submitESignature: builder.mutation({
            query: (password) => ({
                url: 'user_profile/Esignature',
                method: 'POST',
                body: { password }, 
            }),
        }),
    }),
});


export const { useSubmitESignatureMutation } = esignatureApi;
