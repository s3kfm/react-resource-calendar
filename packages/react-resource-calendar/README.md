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
    startsAt: '2026-09-04T09:00:00',
    endsAt: '2026-09-04T10:30:00',
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

Both `startsAt` and `endsAt` are required and accept `Date` objects or ISO date-time
strings. Times are displayed in the browser's local timezone. Include an offset
(e.g. `-04:00` or `Z`) to identify a specific instant, or omit it for local time.
`endsAt` must be later than `startsAt`. Missing, invalid, or reversed ranges throw
`RangeError`; the calendar does not invent fallback dates or infer overnight ends.
For overnight events, explicitly put the following date in `endsAt`.

**Migration:** `date`, `endDate`, `startTime`, and `endTime` were removed from
`GridEvent`. Combine each date and time into its corresponding timestamp.

Assign one resource with `resourceId`, or span several resources with `resourceIds`:

```ts
const multiRoomEvent: GridEvent = {
  id: 'booking-2',
  title: 'Company workshop',
  resourceIds: ['room-a', 'room-b'],
  startsAt: '2026-09-04T13:00:00',
  endsAt: '2026-09-04T15:00:00',
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
| `theme` | `string` | default CSS palette | CSS theme name (`data-grid-theme`) |
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

Define your own theme in a stylesheet loaded after the package CSS:

```tsx
import 'react-resource-calendar/styles.css';
import './calendar-theme.css';

<ResourceCalendar className="booking-calendar" resources={resources} events={events} />
```

```css
.booking-calendar {
  --grid-primary: #7c3aed;
  --grid-surface: #fafafa;
  --grid-border: #ddd6fe;
  --grid-event-blue-bg: #ede9fe;
  --grid-event-blue-border: #7c3aed;
  --grid-event-blue-text: #4c1d95;
}
```

Override only the variables you need. Set overrides on the calendar itself (as above),
rather than on `:root`, because the calendar defines its own defaults. Variables can
reference app tokens, for example `--grid-primary: var(--app-accent)`.
Each calendar can have its own theme. `theme="brand"` simply sets `data-grid-theme="brand"`;
define `.react-resource-calendar[data-grid-theme="brand"]` in your stylesheet.
Without an explicit theme, a `.dark` ancestor selects the dark preset.

Available palette variables are `--grid-surface`, `--grid-surface-subtle`,
`--grid-surface-container`, `--grid-surface-card`, `--grid-surface-hover`,
`--grid-border`, `--grid-border-strong`, `--grid-text-primary`,
`--grid-text-secondary`, `--grid-text-muted`, `--grid-primary`,
`--grid-focus-ring`, `--grid-error`, `--grid-error-bg`, and `--grid-error-border`.

Event categories (`colorTheme`) include blue, teal, amber, purple, rose, and emerald.
Each has `--grid-event-CATEGORY-bg`, `-border`, `-text`, and `-badge` variables.
Unknown categories fall back to blue. Define a custom category using local variables:

```css
.booking-calendar [data-grid-color="surgery"] {
  --grid-event-bg: #f0fdfa;
  --grid-event-border: #0d9488;
  --grid-event-text: #134e4a;
  --grid-event-badge: #ccfbf1;
}
```

This applies to both event cards and resource tabs. Custom event renderers also receive
the category variables through their wrapper. Conflict colors use the error variables.
Calculated positions and dimensions remain controlled by the layout props.

**Migration:** JavaScript theme objects, theme context/hooks, theme helpers, and their
types have been removed. Replace object-valued `theme` props with CSS overrides;
string-valued preset props continue to work.

## TypeScript exports

The main entry point exports the root component, internal building blocks, layout utilities, and all public types. Common types include:

- `ResourceCalendarProps`
- `GridResource`
- `GridEvent`
- `GridDateRange`
- `GridSlotClickInfo`
- `GridEventLayout`

## Browser and layout notes

- The component is client-side React and requires DOM APIs.
- It does not fetch, mutate, or persist data.
- Dates use the browser's local timezone; include an explicit offset in ISO timestamps when needed.
- `timeZoneLabel` changes the displayed label only.
- Give the parent element a usable height because the grid uses `height: 100%` internally.

## License

MIT
