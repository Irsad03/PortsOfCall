import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { registerErrorHandler } from '../api/gameService';

const ToastContext = createContext({ pushToast: () => {} });

const TITLE_BY_STATUS = {
    400: 'Invalid Request',
    403: 'Not Permitted',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Action Not Allowed',
    500: 'Server Error',
};

function titleFor(status) {
    return TITLE_BY_STATUS[status] ?? (status >= 500 ? 'Server Error' : 'Error');
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(0);

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const pushToast = useCallback((toast) => {
        const id = ++idRef.current;
        const ttl = toast.ttl ?? 6000;
        setToasts(prev => [...prev, { id, type: 'info', ...toast }]);
        if (ttl > 0) {
            setTimeout(() => dismiss(id), ttl);
        }
        return id;
    }, [dismiss]);

    useEffect(() => {
        registerErrorHandler(({ status, message }) => {
            pushToast({ type: 'error', title: titleFor(status), message, ttl: 8000 });
        });
        return () => registerErrorHandler(null);
    }, [pushToast]);

    return (
        <ToastContext.Provider value={{ pushToast, dismiss }}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);

function ToastContainer({ toasts, onDismiss }) {
    if (toasts.length === 0) return null;
    return (
        <div className="toast-stack">
            {toasts.map(t => (
                <div key={t.id} className={`toast toast-${t.type}`} role="alert">
                    <div className="toast-body">
                        {t.title && <div className="toast-title">{t.title}</div>}
                        <div className="toast-message">{t.message}</div>
                        {t.actions?.length > 0 && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                {t.actions.map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { action.onClick?.(); onDismiss(t.id); }}
                                        style={{
                                            padding: '4px 10px', fontSize: 12, fontWeight: 600,
                                            background: 'rgba(255,255,255,0.12)',
                                            border: '1px solid rgba(255,255,255,0.35)',
                                            borderRadius: 4, color: 'inherit', cursor: 'pointer',
                                        }}
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        className="toast-close"
                        aria-label="Dismiss notification"
                        onClick={() => onDismiss(t.id)}
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}
