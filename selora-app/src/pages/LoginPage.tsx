import { Avatar } from '../components/Avatar'
import { MICROSOFT_SIGN_OUT } from '../session'

/**
 * Shown after logging out. Microsoft already knows who is at this browser, so logging in is one click;
 * a different person signs out of Microsoft first and then signs in with their own account.
 */
export function LoginPage({ name, email, onLogin }: { name: string; email: string; onLogin: () => void }) {
  const first = name.split(/\s+/)[0] || name
  return (
    <div className="login card">
      <div>
        <h1>Log in</h1>
        <p className="muted">You're logged out of Selora.</p>
      </div>
      <div className="login-account">
        <Avatar email={email} name={name} />
        <span>
          <strong>{name}</strong>
          <span className="muted small">{email}</span>
        </span>
      </div>
      <button className="btn btn-primary" onClick={onLogin} autoFocus>
        Log in as {first}
      </button>
      <div className="login-other">
        <a className="btn" href={MICROSOFT_SIGN_OUT} target="_blank" rel="noreferrer">
          Use a different account
        </a>
        <p className="muted small">
          This signs you out of Microsoft in a new tab. Then reload Selora and sign in with the other account.
          Do this on a shared computer too.
        </p>
      </div>
    </div>
  )
}
