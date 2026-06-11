import React from "react";

interface TableProps {
  headers: string[];
  children: React.ReactNode;
}

export const Table: React.FC<TableProps> = ({ headers, children }) => {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-800/80 bg-darkbg-800/50">
      <table className="w-full border-collapse text-left text-sm text-slate-300">
        <thead className="bg-darkbg-800 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-6 py-4 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 bg-transparent">
          {children}
        </tbody>
      </table>
    </div>
  );
};

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}

export const TableRow: React.FC<TableRowProps> = ({ children, className = "", ...props }) => {
  return (
    <tr className={`hover:bg-darkbg-700/40 transition-colors ${className}`} {...props}>
      {children}
    </tr>
  );
};

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

export const TableCell: React.FC<TableCellProps> = ({ children, className = "", ...props }) => {
  return (
    <td className={`px-6 py-4 whitespace-nowrap align-middle ${className}`} {...props}>
      {children}
    </td>
  );
};
