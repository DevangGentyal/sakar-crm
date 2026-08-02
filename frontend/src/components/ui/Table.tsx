'use client';

import React, { ReactNode, HTMLAttributes } from 'react';

interface TableProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  columns?: number;
}

interface TableHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

interface TableBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

interface TableRowProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

interface TableHeadCellProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  sortable?: boolean;
  onSort?: () => void;
}

interface TableCellProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

// Table container using CSS Grid
export const Table = React.forwardRef<HTMLDivElement, TableProps>(
  ({ className = '', children, columns = 9, ...props }, ref) => (
    <div
      ref={ref}
      className={`w-full text-sm ${className}`}
      {...props}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: '0',
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
);

Table.displayName = 'Table';

// Header section
export const TableHeader = React.forwardRef<HTMLDivElement, TableHeaderProps>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`col-span-full grid grid-cols-subgrid bg-slate-50 border-b border-slate-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);

TableHeader.displayName = 'TableHeader';

// Body section
export const TableBody = React.forwardRef<HTMLDivElement, TableBodyProps>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`contents ${className}`} {...props}>
      {children}
    </div>
  )
);

TableBody.displayName = 'TableBody';

// Row component
export const TableRow = React.forwardRef<HTMLDivElement, TableRowProps>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`col-span-full grid grid-cols-subgrid border-b border-slate-200 hover:bg-slate-50 transition-colors duration-150 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);

TableRow.displayName = 'TableRow';

// Header cell
export const TableHeadCell = React.forwardRef<HTMLDivElement, TableHeadCellProps>(
  ({ className = '', sortable = false, onSort, children, ...props }, ref) => (
    <div
      ref={ref}
      className={`px-6 py-3 text-left font-semibold text-slate-700 flex items-center gap-2 whitespace-nowrap ${
        sortable ? 'cursor-pointer select-none hover:bg-slate-100 transition-colors' : ''
      } ${className}`}
      onClick={onSort}
      {...props}
    >
      {children}
    </div>
  )
);

TableHeadCell.displayName = 'TableHeadCell';

// Body cell
export const TableCell = React.forwardRef<HTMLDivElement, TableCellProps>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`px-6 py-4 text-slate-900 flex items-center whitespace-nowrap overflow-hidden text-ellipsis ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);

TableCell.displayName = 'TableCell';
