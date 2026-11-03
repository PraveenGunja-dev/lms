import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from "constants/config";
import { withStatusCheck } from "services/baseQuery";

export const inventoryApi = createApi({
  reducerPath: "inventoryApi",
  baseQuery: withStatusCheck(fetchBaseQuery({
    baseUrl: config.BACKEND_API_URL,
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  })),
  tagTypes: ['Inventory'], // Define a tag type for inventory data
  endpoints: (builder) => ({
    // Mutation to create a new inventory
    createInventory: builder.mutation({
      query: (inventoryData) => ({
        url: "dms_module/CreateInventory",
        method: "POST",
        body: inventoryData, // Ensure this matches backend expectations
      }),
      invalidatesTags: [{ type: "Inventory", id: "LIST" }], // Invalidate the inventory list cache after creation
      transformResponse: (response) => response.data,
    }),

    // Mutation to update an existing inventory
    updateInventory: builder.mutation({
      query: ({ id, inventory_name }) => ({
        url: `dms_module/UpdateInventory/${id}`,
        method: "PUT",
        body: { inventory_name },
      }),
      invalidatesTags: [{ type: "Inventory", id: "LIST" }], // Invalidate the inventory list cache after update
      transformResponse: (response) => response.data,
    }),

    // Query to fetch all inventory items
    viewInventory: builder.query({
      query: () => ({
        url: "dms_module/ViewInventory",
        method: "GET",
      }),
      providesTags: [{ type: "Inventory", id: "LIST" }], // Tag the response data for inventory list
      transformResponse: (response) => response.data || [], // Return an empty array if no data
    }),

    // Mutation to delete an existing inventory
    deleteInventory: builder.mutation({
      query: (id) => ({
        url: `dms_module/DeleteInventory/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Inventory", id: "LIST" }], // Invalidate the inventory list cache after deletion
      transformResponse: (response) => response.data,
    }),
  }),
});

export const {
  useCreateInventoryMutation,
  useUpdateInventoryMutation, // Export the new update mutation hook
  useViewInventoryQuery,
  useDeleteInventoryMutation,
} = inventoryApi;
