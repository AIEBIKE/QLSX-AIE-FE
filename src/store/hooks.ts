/**
 * =============================================
 * REDUX HOOKS - Typed Hooks
 * =============================================
 * Custom hooks với TypeScript cho Redux
 */

import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./index";

/**
 * useAppDispatch - Typed dispatch hook
 * Sử dụng thay cho useDispatch
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * useAppSelector - Typed selector hook
 * Sử dụng thay cho useSelector
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
