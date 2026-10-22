import { IonButton } from "@ionic/react";

export default function BottomNav({ active, onGo, onAction, actionLabel = "Tambah reading", ionic = false }) {
  return (
    <nav className="tabbar" aria-label="Navigasi utama">
      <Tab id="ringkasan" label="Home" active={active} onGo={onGo}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <path
            d="M4 11.5 11 5l7 6.5V17a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5.5Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      </Tab>
      <Tab id="batch" label="Batch" active={active} onGo={onGo}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <path
            d="M11 3.5 18 7.5v7L11 18.5l-7-4v-7l7-4Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M4 7.5 11 11l7-3.5M11 11v7.5" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      </Tab>
      {ionic ? <IonButton className="ionic-center-action" aria-label={actionLabel} onClick={onAction}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M17 7a7 7 0 1 0 1 7M17 3v4h-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
      </IonButton> : <button type="button" className="tab-add" aria-label={actionLabel} onClick={onAction}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <path d="M11 5v12M5 11h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>}
      <Tab id="peringatan" label="Alert" active={active} onGo={onGo}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <path
            d="M11 4 18.5 17h-15L11 4Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M11 9v3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="11" cy="14.8" r="1.1" fill="currentColor" />
        </svg>
      </Tab>
      <Tab id="akun" label="Profile" active={active} onGo={onGo}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <circle cx="11" cy="7.5" r="3.4" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M4.5 18c1.1-3.2 3.5-4.8 6.5-4.8s5.4 1.6 6.5 4.8"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </Tab>
    </nav>
  );
}

function Tab({ id, label, active, onGo, children }) {
  const on = active === id;
  return (
    <button
      type="button"
      className={on ? "tab on" : "tab"}
      aria-label={label}
      aria-current={on ? "page" : undefined}
      onClick={() => onGo(id)}
    >
      {children}
      <small>{label}</small>
    </button>
  );
}
