import { InputHTMLAttributes, forwardRef, useState } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, style, disabled, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const inputId = id ?? `input-${Math.random().toString(36).slice(2)}`;

    const inputStyle: React.CSSProperties = {
      width: '100%',
      height: '48px',
      padding: '12px 16px',
      fontSize: '1.6rem',
      fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
      fontWeight: 400,
      color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
      backgroundColor: disabled ? 'var(--input-disabled)' : 'var(--input-bg)',
      border: error
        ? '1.5px solid var(--danger-color)'
        : focused
        ? '1.5px solid var(--primary-color)'
        : '1.5px solid var(--border-color)',
      borderRadius: '8px',
      letterSpacing: '-0.1px',
      outline: 'none',
      boxShadow: error
        ? '0 0 0 3px rgba(225,83,93,0.15)'
        : focused
        ? '0 0 0 3px rgba(97,87,234,0.15)'
        : 'none',
      transition: 'border-color 150ms ease, box-shadow 150ms ease, background-color 150ms ease, color 150ms ease',
      boxSizing: 'border-box',
      cursor: disabled ? 'not-allowed' : 'text',
      ...style,
    };

    const labelStyle: React.CSSProperties = {
      display: 'block',
      fontSize: '1.4rem',
      fontWeight: 400,
      color: 'var(--text-secondary)',
      marginBottom: '6px',
    };

    const errorStyle: React.CSSProperties = {
      fontSize: '1.3rem',
      color: 'var(--danger-color)',
      marginTop: '6px',
    };

    const helperStyle: React.CSSProperties = {
      fontSize: '1.3rem',
      color: 'var(--text-muted)',
      marginTop: '6px',
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {label && (
          <label htmlFor={inputId} style={labelStyle}>
            {label}
          </label>
        )}
        <input
          {...props}
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          style={inputStyle}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        />
        {error && (
          <span id={`${inputId}-error`} role="alert" style={errorStyle}>
            {error}
          </span>
        )}
        {!error && helperText && (
          <span id={`${inputId}-helper`} style={helperStyle}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
