import { useState, type FormEvent } from 'react'
import { Icon } from '../components/Icon'
import { validateName } from '../domain/validation'
import type { ShopService } from '../services/ShopService'

/**
 * Shown to someone who is signed in with Microsoft but not yet in Users.
 * Creating the account adds them as a Customer; the email comes from their sign-in and can't be changed.
 */
export function SignUpPage({ service, onDone }: { service: ShopService; onDone: () => void }) {
  const user = service.currentUser()
  const [name, setName] = useState(user.name === user.email ? '' : user.name)
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const problem = touched ? validateName(name) : undefined

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (validateName(name)) return
    setBusy(true)
    setError(undefined)
    try {
      await service.signUp(name)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  return (
    <form className="signup card" onSubmit={submit} noValidate aria-busy={busy}>
      <div>
        <h1>Create your account</h1>
        <p className="muted">Welcome to Selora. Confirm your name to start shopping.</p>
      </div>
      {error && (
        <p className="notice notice-bad" role="alert">
          {error}
        </p>
      )}
      <label className="field">
        <span>Name</span>
        <input
          value={name}
          autoComplete="name"
          maxLength={100}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={problem ? true : undefined}
          aria-describedby={problem ? 'signup-name-error' : undefined}
        />
        {problem && (
          <span className="field-error" id="signup-name-error">
            <Icon name="alert" size={14} />
            {problem}
          </span>
        )}
      </label>
      <label className="field">
        <span>Email</span>
        <input value={user.email} readOnly aria-describedby="signup-email-note" />
        <span className="muted small" id="signup-email-note">
          From your Microsoft sign-in. You'll log in with this account next time.
        </span>
      </label>
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? 'Creating your account…' : 'Create account'}
      </button>
    </form>
  )
}
