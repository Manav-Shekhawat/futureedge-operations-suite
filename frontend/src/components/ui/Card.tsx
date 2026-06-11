import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  headerActions,
  glass = true,
  className = "",
  ...props
}) => {
  const cardStyle = glass 
    ? "glass-card rounded-xl p-5 shadow-xl shadow-black/40"
    : "bg-darkbg-800 border border-slate-800 rounded-xl p-5 shadow-xl shadow-black/20";

  return (
    <div className={`${cardStyle} ${className}`} {...props}>
      {(title || subtitle || headerActions) && (
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
          <div>
            {title && <h3 className="text-base font-semibold text-white tracking-wide">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          </div>
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};
