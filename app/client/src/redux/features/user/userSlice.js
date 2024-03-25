import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isLogged: (typeof window !== 'undefined' && JSON.parse(localStorage?.getItem("userData"))?.isLogged) || false,
  email: (typeof window !== 'undefined' && JSON.parse(localStorage?.getItem("userData"))?.email) || "",
  token: (typeof window !== 'undefined' && JSON.parse(localStorage?.getItem("userData"))?.token) || "",
};


const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    addUser: (state, action) => {
      const { email, token } = action.payload;
      state.isLogged = true;
      state.email = email;
      state.token = token;
      localStorage.setItem("userData", JSON.stringify(state));
      return state;
    },
    deleteUser: (state) => {
      state.isLogged = false;
      state.email = "";
      state.token = "";
      localStorage.setItem("userData", JSON.stringify(state));
      return state;
    },
  },
});

// Helper function to retrieve user data from localStorage on application load
const loadUserFromStorage = () => {
  if(typeof window !== "undefined"){
    if (localStorage?.getItem("userData") === null) {
      localStorage?.setItem("userData", JSON.stringify(initialState));
    } else {
      return;
    }
  }
};

loadUserFromStorage();

export const { addUser, deleteUser } = userSlice.actions;
export default userSlice.reducer;
