// src/api/userProfileApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from 'constants/config';
import { withStatusCheck } from "services/baseQuery";

export const userProfileApi = createApi({
    reducerPath: 'userProfileApi',
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
        resetPassword: builder.mutation({
            query: ({ oldPassword }) => ({
                url: 'user_profile/reset_password',
                method: 'PUT',
                body: {
                    old_password: oldPassword,
                },
            }),
        }),
        otpResetPassword: builder.mutation({
            query: ({ otp, password, confirmPassword }) => ({
                url: 'user_profile/otp_resetpassword',
                method: 'PUT',
                body: {
                    otp,
                    password,
                    confirm_password: confirmPassword,
                },
            }),
        }),
    }),
});

export const { useResetPasswordMutation, useOtpResetPasswordMutation } = userProfileApi;
