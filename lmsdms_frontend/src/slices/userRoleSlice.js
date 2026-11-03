import { createSlice } from "@reduxjs/toolkit";

const loadState = () => {
  try {
    const serializedState = sessionStorage.getItem('userRoleState');
    if (serializedState === null) {
      return {
        role: null,
        is_dms_user: false,
        is_lms_user: false,
        is_active: false,
        sidebarToggle: false
      };
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return {
      role: null,
      is_dms_user: false,
      is_lms_user: false,
      is_active: false,
      sidebarToggle: false
    };
  }
};

// Define the slice
const userRoleSlice = createSlice({
  name: "userRole",
  initialState: loadState(),
  reducers: {
    setUserRole: (state, action) => {
      state.role = action.payload.role;
      sessionStorage.setItem('userRoleState', JSON.stringify(state));
    },
    clearUserRole: (state) => {
      state.role = null;
      state.is_dms_user = false;
      state.is_lms_user = false;
      state.is_active = false;
      sessionStorage.removeItem('userRoleState'); // Clear from sessionStorage
    },
    setUserDetails: (state, action) => {
      const { is_dms_user, is_lms_user, is_active } = action.payload;
      state.is_dms_user = is_dms_user || false;
      state.is_lms_user = is_lms_user || false;
      state.is_active = is_active || false;
      sessionStorage.setItem('userRoleState', JSON.stringify(state));
    },
    setToggle: (state) => {
      state.sidebarToggle = !state.sidebarToggle;
      sessionStorage.setItem('userRoleState', JSON.stringify(state));
    }
  },
});

export const { setUserRole, clearUserRole, setUserDetails, setToggle } = userRoleSlice.actions;


export default userRoleSlice.reducer;