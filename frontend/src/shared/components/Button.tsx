import { ButtonHTMLAttributes, ReactNode, useState } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const variantBase: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: 'var(--primary-color)',
    color: '#FFFFFF',
    border: 'none',
  },
  secondary: {
    backgroundColor: 'var(--button-secondary-bg)',
    color: 'var(--button-secondary-text)',
    border: '1.5px solid var(--button-secondary-border)',
  },
  danger: {
    backgroundColor: 'var(--danger-color)',
    color: '#FFFFFF',
    border: 'none',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--primary-color)',
    border: 'none',
  },
};

const variantHover: Record<ButtonVariant, React.CSSProperties> = {
  primary: { backgroundColor: 'var(--primary-hover)' },
  secondary: { backgroundColor: 'var(--button-secondary-hover)' },
  danger: { backgroundColor: 'var(--danger-hover)' },
  ghost: { backgroundColor: 'rgba(97,87,234,0.08)' },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '8px 16px', fontSize: '1.4rem', minHeight: '36px' },
  md: { padding: '12px 24px', fontSize: '1.6rem', minHeight: '44px' },
  lg: { padding: '14px 28px', fontSize: '1.7rem', minHeight: '52px' },
};

const disabledStyle: React.CSSProperties = {
  backgroundColor: 'var(--input-disabled)',
  color: 'var(--text-muted)',
  border: 'none',
  cursor: 'not-allowed',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);
  const isDisabled = disabled || loading;

  const computedStyle: React.CSSProperties = {
    borderRadius: '9999px',
    fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
    fontWeight: 600,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'background-color 120ms ease, border-color 120ms ease',
    outline: 'none',
    ...(isDisabled ? disabledStyle : {
      ...variantBase[variant],
      ...(hovered ? variantHover[variant] : {}),
    }),
    ...sizeStyles[size],
    ...style,
  };

  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      style={computedStyle}
      onMouseEnter={(e) => { setHovered(true); props.onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setHovered(false); props.onMouseLeave?.(e); }}
    >
      {loading ? '처리 중...' : children}
    </button>
  );
}
