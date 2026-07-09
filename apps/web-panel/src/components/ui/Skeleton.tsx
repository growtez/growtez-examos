import React from 'react';

export const TableRowsSkeleton = ({ rows = 5, columns = 5 }) => {
    return (
        <>
            {Array.from({ length: rows }).map((_, rIdx) => (
                <tr key={rIdx} className="border-b border-border/40 last:border-b-0">
                    {Array.from({ length: columns }).map((_, cIdx) => (
                        <td key={cIdx} className="py-4 px-4 align-middle">
                            <div className="h-4 bg-surface-hover rounded animate-pulse w-full"></div>
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
};
