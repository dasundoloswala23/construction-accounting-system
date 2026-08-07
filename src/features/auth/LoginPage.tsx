import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router'
import { Building2, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/app/providers/AuthProvider'
import { Button } from '@/shared/components'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean(),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login, resetPassword } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [resetting, setResetting] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
  })

  async function onSubmit(values: LoginForm) {
    try {
      await login(values.email, values.password, values.remember)
      navigate('/dashboard', { replace: true })
    } catch {
      toast.error('Invalid email or password')
    }
  }

  async function onForgotPassword() {
    const email = getValues('email')
    if (!email) {
      toast.error('Enter your email above first')
      return
    }
    setResetting(true)
    try {
      await resetPassword(email)
      toast.success('Password reset email sent')
    } catch {
      toast.error('Could not send reset email')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-[var(--bg-surface)] shadow-2xl">
        <div className="flex flex-col items-center gap-3 px-8 pb-6 pt-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Building2 className="h-7 w-7" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Waterman Construction (Pvt) Ltd</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Construction ERP System</p>
          </div>
        </div>

        <div className="border-t border-[var(--border-default)] px-8 py-6">
          <h2 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Sign in to your account</h2>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">Email Address</label>
              <input
                type="email"
                placeholder="admin@waterman.lk"
                className="h-10 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-danger-500">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="h-10 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 pr-10 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger-500">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input type="checkbox" className="h-4 w-4 rounded border-[var(--border-default)]" {...register('remember')} />
                Remember me
              </label>
              <button type="button" onClick={onForgotPassword} disabled={resetting} className="text-sm text-brand-600 hover:underline">
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="w-full" loading={isSubmitting}>
              Sign In
            </Button>
          </form>
        </div>

        <div className="border-t border-[var(--border-default)] px-8 py-4 text-center text-xs text-[var(--text-muted)]">
          Powered by Firebase · Waterman Construction ERP v2.0
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-white/60">© 2026 Waterman Construction (Pvt) Ltd. All rights reserved.</p>
    </div>
  )
}
