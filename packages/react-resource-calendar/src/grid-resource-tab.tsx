import React from 'react';
import { GridResource } from './types';
import { useGridTheme, resolveEventColors } from './theme';

export interface GridResourceTabProps<TMeta = Record<string, unknown>> {
  key?: React.Key;
  resource: GridResource<TMeta>;
  isFirst: boolean;
  resourceColumnWidth?: number;
  onResourceHeaderClick?: (resource: GridResource<TMeta>, event: React.MouseEvent | React.KeyboardEvent) => void;
}

export const GridResourceTab = <TMeta = Record<string, unknown>>({
  resource,
  isFirst,
  resourceColumnWidth = 180,
  onResourceHeaderClick,
}: GridResourceTabProps<TMeta>): React.ReactElement => {
  const theme = useGridTheme();
  const eventColors = resolveEventColors(resource.colorTheme || resource.color, theme);
  const dotColor = resource.color?.startsWith('#') || resource.color?.startsWith('rgb')
    ? resource.color
    : eventColors.border;

  const handleClick = (e: React.MouseEvent) => {
    if (onResourceHeaderClick) {
      onResourceHeaderClick(resource, e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onResourceHeaderClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onResourceHeaderClick(resource, e);
    }
  };

  const isInteractive = Boolean(onResourceHeaderClick);

  return (
    <div
      id={`grid-resource-tab-${resource.id}`}
      role={isInteractive ? 'button' : 'columnheader'}
      aria-label={`Resource column: ${resource.label}${resource.subTitle ? `, ${resource.subTitle}` : ''}`}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? handleClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      style={{
        width: `${resourceColumnWidth}px`,
        minWidth: `${resourceColumnWidth}px`,
        backgroundColor: theme.palette.surfaceSubtle,
        borderColor: theme.palette.border,
      }}
      className={`shrink-0 flex flex-col items-center justify-center py-2 px-2 select-none ${
        !isFirst ? 'border-l' : ''
      } ${
        isInteractive
          ? 'cursor-pointer hover:opacity-85 focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-none transition-colors group/header-tab'
          : ''
      }`}
      title={isInteractive ? `Click or press Enter to manage ${resource.label}` : undefined}
    >
      {/* Custom render if provided by user, else default label + subTitle */}
      {resource.render ? (
        resource.render(resource)
      ) : (
        <div className="w-full flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1.5 max-w-full">
            <span
              className="w-2 h-2 shrink-0 rounded-full"
              style={{ backgroundColor: dotColor }}
            />
            <span
              style={{ color: theme.palette.textPrimary }}
              className="text-[14px] font-semibold truncate transition-colors"
            >
              {resource.label}
            </span>
          </div>
          {resource.subTitle && (
            <span
              style={{ color: theme.palette.textMuted }}
              className="text-[11px] truncate max-w-full mt-0.5"
            >
              {resource.subTitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
