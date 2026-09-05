import React from 'react';
import { GridResource } from './types';
import { GridResourceTab } from './grid-resource-tab';

interface GridResourceHeaderProps<TMeta = Record<string, unknown>> {
  resources: GridResource<TMeta>[];
  onResourceHeaderClick?: (resource: GridResource<TMeta>, event: React.MouseEvent | React.KeyboardEvent) => void;
  headerAction?: React.ReactNode;
  headerActionLabel?: React.ReactNode;
  onHeaderActionClick?: (event: React.MouseEvent | React.KeyboardEvent) => void;
  renderHeaderAction?: (resources: GridResource<TMeta>[]) => React.ReactNode;
  timeColumnWidth?: number;
  resourceColumnWidth?: number;
  timeZoneLabel?: string;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

export const GridResourceHeader = <TMeta = Record<string, unknown>>({
  resources,
  onResourceHeaderClick,
  headerAction,
  headerActionLabel,
  onHeaderActionClick,
  renderHeaderAction,
  timeColumnWidth = 80,
  resourceColumnWidth = 180,
  timeZoneLabel = 'TIME (EST)',
  scrollRef,
}: GridResourceHeaderProps<TMeta>): React.ReactElement => {

  // Determine what to render in the header action slot
  let actionContent: React.ReactNode = null;

  if (renderHeaderAction) {
    actionContent = renderHeaderAction(resources);
  } else if (headerAction) {
    actionContent = headerAction;
  } else if (onHeaderActionClick || headerActionLabel) {
    const handleActionKeyDown = (e: React.KeyboardEvent) => {
      if (onHeaderActionClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onHeaderActionClick(e);
      }
    };

    actionContent = (
      <div
        id="grid-btn-header-action"
        role="button"
        tabIndex={0}
        onClick={onHeaderActionClick}
        onKeyDown={handleActionKeyDown}
        aria-label={typeof headerActionLabel === 'string' ? headerActionLabel : 'Grid header action'}
        style={{
          borderColor: 'var(--grid-border)',
          color: 'var(--grid-text-secondary)',
        }}
        className="h-full flex items-center justify-center border-l hover:opacity-80 focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-none cursor-pointer text-xs font-semibold py-1 px-3 transition-colors select-none"
      >
        {typeof headerActionLabel === 'string' ? (
          <span className="truncate">{headerActionLabel}</span>
        ) : (
          headerActionLabel
        )}
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      role="rowgroup"
      style={{
        backgroundColor: 'var(--grid-surface-subtle)',
        borderColor: 'var(--grid-border)',
      }}
      className="border-b shrink-0 flex overflow-x-auto select-none no-scrollbar sticky top-0 z-40"
      id="grid-resource-header-tabs"
    >
      <div role="row" className="flex items-stretch min-w-full">
        {/* Sticky/Fixed Time Column Label */}
        <div
          role="columnheader"
          aria-label={`Time column timezone: ${timeZoneLabel}`}
          style={{
            width: `${timeColumnWidth}px`,
            minWidth: `${timeColumnWidth}px`,
            backgroundColor: 'var(--grid-surface-subtle)',
            borderColor: 'var(--grid-border)',
            color: 'var(--grid-text-secondary)',
          }}
          className="shrink-0 flex items-end justify-end border-r pb-2 pr-2"
        >
          <span className="font-bold text-[11px] tracking-wider uppercase opacity-90">
            {timeZoneLabel}
          </span>
        </div>

        {/* Resource Column Headers */}
        <div className="flex items-stretch">
          {resources.map((res, index) => (
            <GridResourceTab
              key={res.id}
              resource={res}
              isFirst={index === 0}
              resourceColumnWidth={resourceColumnWidth}
              onResourceHeaderClick={onResourceHeaderClick}
            />
          ))}

          {/* Custom Header Action Slot (Renders nothing if no action is provided) */}
          {actionContent && (
            <div className="shrink-0 flex items-stretch">
              {actionContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
