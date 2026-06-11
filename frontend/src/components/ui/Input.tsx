import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  wrapperClassName = "",
  className = "",
  type = "text",
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
      {label && (
        <label className="text-xs font-semibold text-slate-300 tracking-wider">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`bg-darkbg-900 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500 transition-all ${error ? "border-accent-danger focus:ring-accent-danger focus:border-accent-danger" : ""} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-accent-danger mt-0.5">{error}</span>}
    </div>
  );
});

Input.displayName = "Input";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  options,
  wrapperClassName = "",
  className = "",
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
      {label && (
        <label className="text-xs font-semibold text-slate-300 tracking-wider">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`bg-darkbg-900 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500 transition-all cursor-pointer ${error ? "border-accent-danger focus:ring-accent-danger" : ""} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-darkbg-800 text-white">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-accent-danger mt-0.5">{error}</span>}
    </div>
  );
});

Select.displayName = "Select";
