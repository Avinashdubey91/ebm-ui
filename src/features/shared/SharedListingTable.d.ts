import React from "react";
type Column<T> = {
    key: keyof T;
    label: string;
    width?: string;
    renderCell?: (item: T) => React.ReactNode;
};
type PaginationProps = {
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    onPageChange: (nextPageNumber: number) => void;
    onPageSizeChange: (nextPageSize: number) => void;
    pageSizeOptions?: number[];
};
type Props<T> = {
    data: T[];
    columns: Column<T>[];
    loading?: boolean;
    minLoadingMs?: number;
    sortField: keyof T;
    sortAsc: boolean;
    onSort: (field: keyof T) => void;
    onEdit: (id?: number) => void;
    onDelete: (id?: number) => void;
    expandedRowId: number | null;
    onExpand: (id: number | null) => void;
    renderExpandedRow?: (item: T) => React.ReactNode;
    getRowKey: (item: T) => number;
    pagination?: PaginationProps;
};
declare function SharedListingTable<T>({ data, columns, loading, minLoadingMs, sortField, sortAsc, onSort, onEdit, onDelete, expandedRowId, onExpand, renderExpandedRow, getRowKey, pagination, }: Props<T>): import("react/jsx-runtime").JSX.Element;
export default SharedListingTable;
