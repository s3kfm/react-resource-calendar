import { formatEventTime } from './grid-utils';
import React from 'react';
import { AlertTriangle, Clock, ArrowLeft, ArrowRight, Layers } from 'lucide-react';
import { GridEvent, GridEventLayout } from './types';

interface GridEventCardProps<TData = Record<string, unknown>> {
  key?: React.Key;
  event: GridEvent<TData>;
  layout: GridEventLayout;
  onClick?: (event: GridEvent<TData>, mouseEvent: React.MouseEvent | React.KeyboardEvent) => void;
  renderEvent?: (event: GridEvent<TData>, layout: GridEventLayout) => React.ReactNode;
}

export const GridEventCard = <TData = Record<string, unknown>>({
  event,
  layout,
  onClick,
  renderEvent,
}: GridEventCardProps<TData>): React.ReactElement => {

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onClick?.(event, e);
    }
  };

  // If custom event renderer is provided either at event level or grid level
  if (event.render) {
    return (
      <div
        id={`grid-event-${event.id}`}
        data-grid-color={(event.colorTheme || 'blue').toLowerCase()}
        role="button"
        tabIndex={0}
        aria-label={`Event: ${event.title}`}
        style={{
          top: `${layout.topPx}px`,
          height: `${layout.heightPx}px`,
          ...(layout.leftPx !== undefined ? { left: `${layout.leftPx}px`, width: `${layout.widthPx}px` } : {}),
        }}
        className={`absolute ${layout.leftPx === undefined ? 'left-1 right-1' : ''} cursor-pointer select-none pointer-events-auto focus-visible:ring-2 focus-visible:outline-none`}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(event, e);
        }}
        onKeyDown={handleKeyDown}
      >
        {event.render(event, layout)}
      </div>
    );
  }

  if (renderEvent) {
    return (
      <div
        id={`grid-event-${event.id}`}
        data-grid-color={(event.colorTheme || 'blue').toLowerCase()}
        role="button"
        tabIndex={0}
        aria-label={`Event: ${event.title}`}
        style={{
          top: `${layout.topPx}px`,
          height: `${layout.heightPx}px`,
          ...(layout.leftPx !== undefined ? { left: `${layout.leftPx}px`, width: `${layout.widthPx}px` } : {}),
        }}
        className={`absolute ${layout.leftPx === undefined ? 'left-1 right-1' : ''} cursor-pointer select-none pointer-events-auto focus-visible:ring-2 focus-visible:outline-none`}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(event, e);
        }}
        onKeyDown={handleKeyDown}
      >
        {renderEvent(event, layout)}
      </div>
    );
  }

  // Determine overlap positioning if in conflict (when absolute coordinates aren't provided)
  let positionClass = 'left-1 right-1 z-10';
  if (layout.hasConflict) {
    if (layout.conflictOverlapSide === 'left') {
      positionClass = 'left-1 right-6 z-20';
    } else if (layout.conflictOverlapSide === 'right') {
      positionClass = 'left-6 right-1 z-30 opacity-95';
    }
  }

  const isShortEvent = layout.heightPx <= 50;
  const isMicroEvent = layout.heightPx < 36;
  const timeDisplay = `${formatEventTime(event.startsAt)} - ${formatEventTime(event.endsAt)}`;

  // Base rounding
  let roundedTopLeft = true;
  let roundedTopRight = true;
  let roundedBottomLeft = true;
  let roundedBottomRight = true;

  const dynamicStyles: React.CSSProperties = {
    backgroundColor: layout.hasConflict ? 'var(--grid-error-bg)' : 'var(--grid-event-bg)',
    color: layout.hasConflict ? 'var(--grid-error)' : 'var(--grid-event-text)',
    borderLeft: `3px solid ${layout.hasConflict ? 'var(--grid-error)' : 'var(--grid-event-border)'}`,
  };

  if (layout.hasConflict) {
    dynamicStyles.border = `2px solid var(--grid-error)`;
  }

  if (layout.dashedBorderLeft) {
    roundedTopLeft = false;
    roundedBottomLeft = false;
    dynamicStyles.borderLeft = `3px dashed var(--grid-event-border)`;
  }

  if (layout.dashedBorderRight) {
    roundedTopRight = false;
    roundedBottomRight = false;
    dynamicStyles.borderRight = `3px dashed var(--grid-event-border)`;
  }

  if (layout.extendsBeyondEnd) {
    roundedBottomLeft = false;
    roundedBottomRight = false;
    dynamicStyles.borderBottom = `3px dotted var(--grid-error)`;
  }

  const roundingClass = `${roundedTopLeft ? 'rounded-tl' : 'rounded-tl-none'} ${
    roundedTopRight ? 'rounded-tr' : 'rounded-tr-none'
  } ${roundedBottomLeft ? 'rounded-bl' : 'rounded-bl-none'} ${
    roundedBottomRight ? 'rounded-br' : 'rounded-br-none'
  }`;

  const hasExplicitDimensions = layout.leftPx !== undefined && layout.widthPx !== undefined;

  const accessibleLabel = `${event.title}${timeDisplay ? `, ${timeDisplay}` : ''}${
    layout.colSpan && layout.colSpan > 1 ? `, Spanning ${layout.colSpan} rooms` : ''
  }${layout.dashedBorderLeft || layout.dashedBorderRight ? ', Multi-room connected' : ''}${
    layout.hasConflict ? ', Overlap conflict detected' : ''
  }${layout.extendsBeyondEnd ? `, Extends ${layout.overflowText || 'beyond range'}` : ''}`;

  return (
    <div
      id={`grid-event-${event.id}`}
      data-grid-color={(event.colorTheme || 'blue').toLowerCase()}
      data-event-id={event.id}
      role="button"
      tabIndex={0}
      aria-label={accessibleLabel}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(event, e);
      }}
      onKeyDown={handleKeyDown}
      style={{
        top: `${layout.topPx}px`,
        height: `${layout.heightPx}px`,
        ...(hasExplicitDimensions
          ? {
              left: `${layout.leftPx}px`,
              width: `${layout.widthPx}px`,
            }
          : {}),
        ...dynamicStyles,
      }}
      className={`absolute ${hasExplicitDimensions ? 'z-10' : positionClass} ${roundingClass} shadow-xs p-1.5 cursor-pointer pointer-events-auto hover:brightness-95 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none transition-all group overflow-hidden select-none flex flex-col justify-between`}
      title={`${event.title}${timeDisplay ? ` (${timeDisplay})` : ''}${layout.colSpan && layout.colSpan > 1 ? ` - Spanning ${layout.colSpan} rooms` : ''}${layout.dashedBorderLeft || layout.dashedBorderRight ? ' - Multi-room connected event' : ''}${layout.hasConflict ? ' - CONFLICT DETECTED' : ''}${layout.extendsBeyondEnd ? ` - Extends ${layout.overflowText || 'beyond range'}` : ''}`}
    >
      <div>
        <div className="flex justify-between items-start gap-1">
          <div className="text-[12px] font-semibold leading-tight truncate flex items-center gap-1.5">
            {layout.dashedBorderLeft && (
              <span className="text-[10px] shrink-0 opacity-70" title="Continuation from connected room">
                <ArrowLeft className="w-3 h-3 inline-block" />
              </span>
            )}
            <span className="truncate">{event.title}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {layout.colSpan && layout.colSpan > 1 && (
              <span
                style={{ backgroundColor: 'var(--grid-event-badge)' }}
                className="text-[9px] font-medium px-1 py-0.2 rounded text-current flex items-center gap-0.5 shrink-0"
                title={`Spans ${layout.colSpan} rooms (${layout.connectedResourceNames?.join(', ') || ''})`}
              >
                <Layers className="w-2.5 h-2.5" />
                <span>{layout.colSpan} Rooms</span>
              </span>
            )}
            {layout.dashedBorderRight && (
              <span className="text-[10px] opacity-70 shrink-0" title="Continues across to connected room">
                <ArrowRight className="w-3 h-3 inline-block" />
              </span>
            )}
            {layout.hasConflict && (
              <span
                style={{ color: 'var(--grid-error)' }}
                title="Overlap Conflict with another scheduled event"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
              </span>
            )}
            {layout.extendsBeyondEnd && isMicroEvent && layout.overflowText && (
              <span
                style={{
                  color: 'var(--grid-error)',
                  borderColor: 'var(--grid-error)',
                }}
                className="text-[9px] font-mono font-bold bg-[var(--grid-surface-card)] px-1 py-0.2 rounded border border-dotted"
              >
                {layout.overflowText}
              </span>
            )}
          </div>
        </div>

        {timeDisplay && !isMicroEvent && (
          <div
            style={{ color: 'var(--grid-text-secondary)' }}
            className="font-mono text-[10px] truncate mt-0.5 flex items-center justify-between"
          >
            <span>{timeDisplay}</span>
            {layout.isMultiResource && layout.totalSegments && layout.totalSegments > 1 && (
              <span className="text-[9px] font-sans font-semibold uppercase tracking-wider opacity-75">
                Part {((layout.segmentIndex ?? 0) + 1)} of {layout.totalSegments}
              </span>
            )}
          </div>
        )}

        {!isShortEvent && event.subTitle && (
          <div
            style={{ color: 'var(--grid-text-muted)' }}
            className="text-[11px] truncate mt-0.5 flex items-center gap-1"
          >
            <span className="truncate">{event.subTitle}</span>
          </div>
        )}
      </div>

      {/* Overflow indicator when event extends beyond range end boundary */}
      {layout.extendsBeyondEnd && !isMicroEvent && (
        <div
          style={{
            borderColor: 'var(--grid-error-border)',
            color: 'var(--grid-error)',
          }}
          className="mt-auto pt-1 flex items-center justify-between text-[10px] font-mono font-bold border-t border-dotted"
        >
          <span className="truncate flex items-center gap-1">
            <Clock className="w-3 h-3 shrink-0" />
            <span>{layout.overflowText || 'more'}</span>
          </span>
          <span
            style={{ color: 'var(--grid-text-muted)' }}
            className="text-[9px] font-sans font-medium uppercase tracking-wider shrink-0 hidden sm:inline"
          >
            Out of range
          </span>
        </div>
      )}
    </div>
  );
};
