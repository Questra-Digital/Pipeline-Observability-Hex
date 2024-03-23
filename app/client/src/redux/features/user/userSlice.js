import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isLogged: JSON.parse(localStorage?.getItem("userData"))?.isLogged || false,
  email: JSON.parse(localStorage?.getItem("userData"))?.email || '',
  token: JSON.parse(localStorage?.getItem("userData"))?.token || '',
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    addUser: (state, action) => {
      const { email, token } = action.payload;
      return {
        ...state,
        isLogged: true,
        email,
        token,
      };
    localStorage?.setItem("userData", JSON.stringify(state));
    },
    deleteUser: (state) => {
      return {
        isLogged: false,
        email: "",
        token: "",
      };
      localStorage?.setItem("userData", JSON.stringify(state));
    },
  },
});

// Helper function to retrieve user data from localStorage on application load
const loadUserFromStorage = () => {
  if(localStorage?.getItem("userData") === null){
    localStorage?.setItem("userData", JSON.stringify(initialState));
}else{
   return
}
};

loadUserFromStorage();

export const { addUser, deleteUser } = userSlice.actions;
export default userSlice.reducer;
