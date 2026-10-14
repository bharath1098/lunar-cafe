import { CSSProperties, ReactNode } from "react";

export function NeoCard({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`neo-card ${className}`} style={style}>
      {children}
    </div>
  );
}

export function NeoButton({
  children,
  onClick,
  type = "button",
  variant = "primary",
  className = "",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "ghost" | "danger";
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`neo-btn neo-btn-${variant} ${className}`}
    >
      {children}
    </button>
  );
}

export function NeoInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string },
) {
  const { label, className = "", ...rest } = props;
  return (
    <label className="neo-field">
      {label && <span>{label}</span>}
      <input className={`neo-input ${className}`} {...rest} />
    </label>
  );
}

export function NeoSelect(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string },
) {
  const { label, className = "", children, ...rest } = props;
  return (
    <label className="neo-field neo-field-select">
      {label && <span>{label}</span>}
      <span className="neo-select-wrap">
        <select className={`neo-select ${className}`} {...rest}>
          {children}
        </select>
      </span>
    </label>
  );
}

export function NeoTextarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string },
) {
  const { label, className = "", ...rest } = props;
  return (
    <label className="neo-field">
      {label && <span>{label}</span>}
      <textarea className={`neo-input ${className}`} {...rest} />
    </label>
  );
}

export function Badge({
  children,
  tone = "mint",
}: {
  children: ReactNode;
  tone?: "mint" | "gold" | "rose" | "ink";
}) {
  return <span className={`neo-badge neo-badge-${tone}`}>{children}</span>;
}
