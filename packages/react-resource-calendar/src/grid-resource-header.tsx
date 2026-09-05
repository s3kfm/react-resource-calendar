import React from 'react';
import { GridResource } from './types';
import { GridResourceTab } from './grid-resource-tab';

interface GridResourceHeaderProps<TMeta = Record<string, unknown>> {
  resources: GridResource<TMeta>[];
  onResourceHeaderClick?: (resource: GridResource<TMeta>, event: React.MouseEvent | React.KeyboardEvent) => void;
  timeColumnWidth?: number;
  resourceColumnWidth?: number;
  timeZoneLabel?: string;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

export const GridResourceHeader = <TMeta = Record<string, unknown>>({
  resources,
  onResourceHeaderClick,
  timeColumnWidth = 80,
  resourceColumnWidth = 180,
  timeZoneLabel = 'TIME (EST)',
  scrollRef,
}: GridResourceHeaderProps<TMeta>): React.ReactElement => {
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
        </div>
      </div>
    </div>
  );
};
