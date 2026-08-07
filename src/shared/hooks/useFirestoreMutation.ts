import { useMutation, type UseMutationOptions } from '@tanstack/react-query'
import toast from 'react-hot-toast'

/**
 * Thin wrapper around TanStack Query's useMutation that standardizes
 * success/error toasts for the create/update/delete calls each feature's
 * api.ts exposes. Firestore reads stay live via useCollection/useDocument
 * (onSnapshot), so mutations never need to manually invalidate a query cache.
 */
export function useFirestoreMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    successMessage?: string
    errorMessage?: string
  } & Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'> = {}
) {
  const { successMessage, errorMessage, onSuccess, onError, ...rest } = options
  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onSuccess: (...args) => {
      if (successMessage) toast.success(successMessage)
      onSuccess?.(...args)
    },
    onError: (...args) => {
      const [error] = args
      toast.error(errorMessage ?? error.message ?? 'Something went wrong')
      onError?.(...args)
    },
    ...rest,
  })
}
