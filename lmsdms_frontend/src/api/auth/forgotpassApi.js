import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from 'constants/config';
import { withStatusCheck } from "services/baseQuery";

export const forgotPassApi = createApi({
    reducerPath: 'forgotPassApi',
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
        requestForgotPasswordOtp: builder.mutation({
            query: (email) => ({
                url: 'user_profile/request_forgot_password_otp',
                method: 'POST',
                body: { email },
            }),
        }),
        verifyForgotPasswordOtp: builder.mutation({
            query: ({ email, otp, password, confirmPassword }) => ({
                url: 'user_profile/forgot_password_otp',
                method: 'POST',
                body: {
                    email,
                    otp,
                    password,
                    confirm_password: confirmPassword,
                },
            }),
        }),
    }),
});

export const { 
    useRequestForgotPasswordOtpMutation, 
    useVerifyForgotPasswordOtpMutation 
} = forgotPassApi;
