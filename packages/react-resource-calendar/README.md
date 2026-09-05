# React Resource Calendar

A typed React scheduling grid for appointments distributed across rooms, staff, equipment, or any other resources.

## Install

```bash
npm install react-resource-calendar
```

React 18 and 19 are supported. Import the compiled stylesheet once in your application entry point; your application does not need Tailwind CSS.

```tsx
import 'react-resource-calendar/styles.css';
```

The grid fills its parent, so render it inside an element with an explicit height.

## Basic usage

```tsx
import {
  ResourceCalendar,
  type GridEvent,
  type GridResource,
  type GridSlotClickInfo,
} from 'react-resource-calendar';
import 'react-resource-calendar/styles.css';

const resources: GridResource[] = [
  { id: 'room-a', label: 'Studio A', subTitle: 'Main floor', colorTheme: 'blue' },
  { id: 'room-b', label: 'Studio B', subTitle: 'Second floor', colorTheme: 'teal' },
];

const events: GridEvent[] = [
  {
    id: 'booking-1',
    title: 'Product shoot',
    resourceId: 'room-a',
    date: '2026-09-04',
    startTime: '09:00',
    endTime: '10:30',
    subTitle: 'Northwind Studio',
    status: 'confirmed',
    colorTheme: 'blue',
  },
];

export function Schedule() {
  const handleEmptySlot = (slot: GridSlotClickInfo) => {
    console.log('Create at', slot.date, 'for', slot.resourceId);
  };

  return (
    <div style={{ height: 720 }}>
      <ResourceCalendar
        startsAt={new Date(2026, 8, 4)}
        endsAt={new Date(2026, 8, 5)}
        resources={resources}
        events={events}
        startHour={8}
        endHour={18}
        intervalMinutes={15}
        onGridClick={handleEmptySlot}
        onEventClick={(event) => console.log('Selected', event)}
      />
    </div>
  );
}
```

The component is controlled: your application owns the resource and event arrays. Use callbacks to open your editor, update application state, and pass the new arrays back to the grid.

## Resource data

Every resource needs a stable `id` and a display `label`.

```ts
interface GridResource<TMeta = Record<string, unknown>> {
  id: string;
  label: string;
  subTitle?: string;
  color?: string;
  colorTheme?: string;
  type?: string;
  category?: string;
  location?: string;
  active?: boolean;
  order?: number;
  meta?: TMeta;
}
```

Use `GridResource<TMeta>` to keep application-specific metadata type-safe.

## Event data

An event requires `id` and `title`, plus one or more resources and a time range. Use full timestamps:

```ts
{
  startsAt: '2026-09-04T09:00:00-04:00',
  endsAt: '2026-09-04T10:30:00-04:00'
}
```

Or separate local date and time fields:

```ts
{
  date: '2026-09-04',
  startTime: '09:00',
  endTime: '10:30'
}
```

Assign one resource with `resourceId`, or span several resources with `resourceIds`:

```ts
const multiRoomEvent: GridEvent = {
  id: 'booking-2',
  title: 'Company workshop',
  resourceIds: ['room-a', 'room-b'],
  date: '2026-09-04',
  startTime: '13:00',
  endTime: '15:00',
};
```

Use `GridEvent<TData>` and its `data` property to retain your domain model in callbacks.

## Date ranges

For ordinary full-day ranges, pass JavaScript `Date` objects to `startsAt` and `endsAt`.

For working hours, gaps, or explicit continuous boundaries, use `dateRanges`:

```tsx
<ResourceCalendar
  dateRanges={[
    {
      id: 'friday',
      startsAt: new Date(2026, 8, 4, 8),
      endsAt: new Date(2026, 8, 4, 18),
      label: 'Friday, September 4',
    },
    {
      id: 'saturday',
      startsAt: new Date(2026, 8, 5, 9),
      endsAt: new Date(2026, 8, 5, 14),
      label: 'Saturday, September 5',
    },
  ]}
  resources={resources}
  events={events}
/>
```

Ranges whose end and start timestamps meet exactly render as one continuous timeline. A time gap creates a separate date section.

## Important props

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `resources` | `GridResource[]` | required | Resource columns |
| `events` | `GridEvent[]` | required | Events to display |
| `startsAt` / `endsAt` | `Date` | today | Inclusive date span |
| `dateRanges` | `GridDateRange[]` | — | Explicit date/time windows |
| `startHour` / `endHour` | `number` | `8` / `24` | Default daily bounds |
| `intervalMinutes` | `number` | `15` | Clickable sub-slot duration |
| `subHourGrading` | `none \| dashed \| solid \| dotted` | `none` | Sub-hour divider style |
| `timeSlotHeight` | `number` | `48` | Pixels per hour |
| `timeColumnWidth` | `number` | `80` | Time-gutter width |
| `resourceColumnWidth` | `number` | `180` | Minimum resource width |
| `timeZoneLabel` | `string` | `TIME (EST)` | Header label; it does not convert time |
| `theme` | preset or theme object | `default` | Visual theme |
| `className` | `string` | empty | Extra root classes |
| `ariaLabel` | `string` | `Resource scheduling grid` | Accessible region name |

## Interaction callbacks

```tsx
<ResourceCalendar
  resources={resources}
  events={events}
  onGridClick={(slot) => openCreateDialog(slot)}
  onEventClick={(event) => openEventDialog(event)}
  onResourceHeaderClick={(resource) => openResourceDialog(resource)}
  headerActionLabel="Add resource"
  onHeaderActionClick={() => openResourceDialog()}
/>
```

`onGridClick` receives the selected `Date`, `YYYY-MM-DD` string, resource ID, `HH:mm` time, and minute offset.

## Custom event rendering

```tsx
<ResourceCalendar
  resources={resources}
  events={events}
  renderEvent={(event, layout) => (
    <div>
      <strong>{event.title}</strong>
      {layout.hasConflict && <span>Conflict</span>}
    </div>
  )}
/>
```

Each resource can define `render(resource)`, and each individual event can define `render(event, layout)`.

## Themes

Choose `default`, `warm`, `clinical`, or `dark`:

```tsx
<ResourceCalendar theme="dark" resources={resources} events={events} />
```

Or supply a partial custom theme; unspecified values inherit from the default:

```tsx
<ResourceCalendar
  theme={{
    name: 'brand',
    palette: { primary: '#7c3aed', surface: '#fafafa' },
  }}
  resources={resources}
  events={events}
/>
```

CSS variables such as `--grid-primary`, `--grid-border`, and `--grid-surface` can also be overridden in your stylesheet.

## TypeScript exports

The main entry point exports the root component, internal building blocks, theme helpers, layout utilities, and all public types. Common types include:

- `ResourceCalendarProps`
- `GridResource`
- `GridEvent`
- `GridDateRange`
- `GridSlotClickInfo`
- `GridEventLayout`
- `GridTheme` and `GridThemeInput`

## Browser and layout notes

- The component is client-side React and requires DOM APIs.
- It does not fetch, mutate, or persist data.
- Dates use the browser's local timezone; include an explicit offset in ISO timestamps when needed.
- `timeZoneLabel` changes the displayed label only.
- Give the parent element a usable height because the grid uses `height: 100%` internally.

## License

MIT
