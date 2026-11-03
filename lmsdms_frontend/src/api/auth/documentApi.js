import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from "constants/config";
import { withStatusCheck } from "services/baseQuery";

export const documentApi = createApi({
  reducerPath: "documentApi",
  baseQuery: withStatusCheck(fetchBaseQuery({
    baseUrl: config.BACKEND_API_URL,
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  })),
  tagTypes: ["Documents", "DocumentTypes"], // Define tags for cache management
  endpoints: (builder) => ({
    createDocument: builder.mutation({
      query: (documentData) => ({
        url: "dms_module/create_document",
        method: "POST",
        body: documentData,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ["Documents"], // Invalidate document data to trigger refetch
    }),

    createDocumentType: builder.mutation({
      query: (documentTypeData) => ({
        url: "dms_module/create_get_document_type",
        method: "POST",
        body: documentTypeData,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ["DocumentTypes"], // Invalidate document type data to trigger refetch
    }),

    fetchDocumentTypes: builder.query({
      query: () => ({
        url: "dms_module/get_document_type",
        method: "GET",
      }),
      transformResponse: (response) => response.data,
      providesTags: ["DocumentTypes"], // Tag document types data for cache management
      keepUnusedDataFor: 30, // Keep unused data for 30 seconds
      refetchInterval: 3000, // Auto-refetch every 30 seconds
    }),

    fetchDocuments: builder.query({
      query: (groupId) => `dms_module/view_document/${groupId}`,
      transformResponse: (response) => {
        return {
          documents: response.data,
          userGroupIds: response.user_group_ids, // Include user_group_ids
        };
      },
      providesTags: ["Documents"], // Tag documents data for cache management
      keepUnusedDataFor: 1, // Keep unused data for 30 seconds
      refetchInterval: 3000, // Auto-refetch every 30 seconds
    }),

    createTemplate: builder.mutation({
      query: (templateData) => ({
        url: "dms_module/CreateTemplate",
        method: "POST",
        body: templateData,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ["Documents"], // Invalidate document data to trigger refetch
    }),

    viewTemplate: builder.query({
      query: () => ({
        url: "dms_module/ViewTemplate",
        method: "GET",
      }),
      transformResponse: (response) => response.data,
    }),

    editTemplate: builder.mutation({
      query: ({ templateId, templateData }) => {
        const formData = new FormData();
        formData.append("template_name", templateData.template_name);
        if (templateData.template_doc) {
          formData.append("template_doc", templateData.template_doc);
        }

        return {
          url: `dms_module/EditTemplate/${templateId}`,
          method: "PUT",
          body: formData,
        };
      },
      transformResponse: (response) => response.data,
      invalidatesTags: ["Documents"], // Invalidate document data to trigger refetch
    }),

    updateTemplate: builder.mutation({
      query: ({ temp_id, template_name, template_doc }) => {
        const formData = new FormData();
        formData.append("template_name", template_name);
        if (template_doc) {
          formData.append("template_doc", template_doc);
        }

        return {
          url: `dms_module/UpdateTemplate/${temp_id}`,
          method: "PUT",
          body: formData,
        };
      },
      transformResponse: (response) => response.data,
      invalidatesTags: ["Documents"], // Invalidate document data to trigger refetch
    }),

    updateDocumentType: builder.mutation({
      query: ({ document_type_id, document_name }) => {
        return {
          url: `dms_module/update_document_type/${document_type_id}`,
          method: "PUT",
          body: {
            document_name: document_name,
          },
        };
      },
      transformResponse: (response) => response,
      invalidatesTags: ["DocumentTypes"], // Invalidate document types data to trigger refetch
    }),
    departmentWiseReviewer: builder.query({
      query: () => ({
        url: "user_profile/all_reviewer",
        method: "GET",
      }),
      transformResponse: (response) => response.data, // Extract the "data" field from the response
      providesTags: ["Reviewers"], // Tag reviewers data for cache management
      keepUnusedDataFor: 30, // Keep unused data for 30 seconds
      refetchInterval: 30000, // Auto-refetch every 30 seconds
    }),
    fetchAllDocuments: builder.query({
      query: () => "dms_module/all_document",
      transformResponse: (response) => response.data,
      providesTags: ["Documents"], // Tag documents data for cache management
    }),
    generateCertificatePdf: builder.query({
      query: (documentId) => ({
        url: `dms_module/document_certificate_pdf_generate/${documentId}`,
        method: "GET",
      }),
      transformResponse: (response) => response.data, // Extract the "data" field from the response
      providesTags: ["Documents"], // Tag documents data for cache management
    }),
    getObsoleteStatusData: builder.query({
      query: () => ({
        url: "dms_module/get_obsolete_satatus_data_to_doc_admin_user_only",
        method: "GET",
      }),
      transformResponse: (response) => response.data, // Transform the response to only include the 'data' part
      providesTags: ["Documents"], // Tag it for cache management, as this fetches document-related data
    }),
    fetchParentDocuments: builder.query({
      query: (documentId) => ({
        url: `dms_module/parent_document/${documentId}`,
        method: "GET",
      }),
      transformResponse: (response) => response.data, // Extract only the 'data' field
      providesTags: ["Documents"], // Tag it for cache management
    }),
    updateObsoleteStatus: builder.mutation({
      query: ({ document_id, status }) => {
        const formData = new FormData();
        formData.append("document_id", document_id);
        formData.append("status", status);

        return {
          url: "dms_module/docadmin_obsolete_status",
          method: "POST",
          body: formData,
        };
      },
      transformResponse: (response) => response, // Transform the response if needed
      invalidatesTags: ["Documents"], // Invalidate document data to trigger refetch
    }),
    saveDocumentDraft: builder.mutation({
      query: ({ documentId, draftData }) => ({
        url: `dms_module/add_comment/${documentId}`,
        method: "POST",
        body: draftData,
      }),
    }),

    documentEffective: builder.mutation({
      query: ({ document, status }) => ({
        url: "dms_module/document_effective",
        method: "POST",
        body: { document, status }, 
      }),
      transformResponse: (response) => response,
    }),   
    fetchDocumentVersionList: builder.query({
      query: (documentId) => ({
        url: `dms_module/document_version_list`,
        method: "GET",
      }),
      transformResponse: (response) => response.data,
      providesTags: ["Documents"],
    }),
    
    selectedUserGet: builder.query({
      query: ({ documentId }) => ({
        url: `dms_module/document_id_wise_author_reviewer_approver_doc_admin/${documentId}`,
        method: "GET",  
      }),
      transformResponse: (response) => response,  
    }),
    fetchSendbackData: builder.query({
      query: (documentId) => ({
        url: `dms_module/get_sendbackdata?document_id=${documentId}`,
        method: "GET",
      }),
    }),
    fetchDocumentExcelReport: builder.query({
      query: ({ department_id = "", document_current_status = "" }) => ({
        url: `dms_module/document_excel_report?department_id=${department_id}&document_current_status=${document_current_status}`,
        method: "GET",
      }),
      transformResponse: (response) => response,  
    }),
    
  }),
});

export const {
  useCreateDocumentMutation,
  useCreateDocumentTypeMutation,
  useFetchDocumentTypesQuery,
  useFetchDocumentsQuery,
  useCreateTemplateMutation,
  useViewTemplateQuery,
  useEditTemplateMutation,
  useUpdateTemplateMutation,
  useUpdateDocumentTypeMutation,
  useDepartmentWiseReviewerQuery,
  useFetchAllDocumentsQuery,
  useGenerateCertificatePdfQuery,
  useGetObsoleteStatusDataQuery,
  useFetchParentDocumentsQuery,
  useUpdateObsoleteStatusMutation,
  useSaveDocumentDraftMutation,
  useDocumentEffectiveMutation,
  useFetchDocumentVersionListQuery,
  useSelectedUserGetQuery,
  useFetchSendbackDataQuery,
  useFetchDocumentExcelReportQuery,
} = documentApi;
