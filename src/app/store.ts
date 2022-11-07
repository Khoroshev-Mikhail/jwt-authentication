import { configureStore, ThunkAction, Action, createSlice } from '@reduxjs/toolkit';
export type User = {id: number, login: string, token: string | null}
const user = {id: 0, login: 'unknown', token: null}
const userSlice = createSlice({
  name: 'userSlice',
  initialState: user,
  reducers: {},
  // extraReducers: (builder) => {
  //     builder.addCase(dictionaryThunk.fulfilled, (_, action) => action.payload)
  // }
})


export const store = configureStore({
  reducer: {
    user: userSlice.reducer
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;
