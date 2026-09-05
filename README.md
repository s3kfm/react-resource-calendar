# React Resource Calendar

## About the project

React Resource Calendar is a React component for displaying events across shared resources such as rooms, staff, equipment, studios, or operating theatres.

It was built because there is no dependable free resource calendar that covers this use case well. General calendar components usually treat the calendar itself as the primary concern and provide limited support for resource columns, events assigned to several resources, irregular working hours, or schedules that continue across midnight. Commercial schedulers solve some of these problems, but they are often tied to a larger product or priced beyond the needs of a small application.

The aim of this project is narrower: provide a stable, reusable grid for resource scheduling and leave business logic to the application using it. The component displays resources and events, calculates their layout, and reports user interactions. It does not own application state, save data, or prescribe how bookings should be edited.

The repository contains two workspaces:

```text
packages/react-resource-calendar  React component published to npm
apps/playground                   Example app used during development
```

The playground uses the package source directly. Changes made under `packages/react-resource-calendar/src` are reflected in the browser through Vite HMR without rebuilding or reinstalling the package.

## Development

### Requirements

- Node.js 20 or later
- pnpm 10 or later

Install the workspace dependencies from the repository root:

```sh
pnpm install
```

The package has a small runtime surface:

- `react` is a peer dependency and is supplied by the consuming application.
- `lucide-react` provides the icons used by the default renderers.
- Tailwind CSS and Vite are development dependencies used to compile the package JavaScript and stylesheet.
- `vite-plugin-dts` generates the published TypeScript declarations.

### Running the project

Start the playground from the repository root:

```sh
pnpm dev
```

The application runs at `http://localhost:3000`.

Most component work happens in `packages/react-resource-calendar/src`. The playground source is in `apps/playground/src` and should be used to reproduce behaviour, exercise changes, and document realistic integrations.

### Styling

Component styles are defined in:

```text
packages/react-resource-calendar/src/grid.css
```

The file contains the Tailwind entry point, the classes used by the package, and the CSS custom properties for the grid themes. Component markup and Tailwind classes live beside the relevant component in `packages/react-resource-calendar/src`.

When adding or changing styles:

1. Keep reusable colours and surface values in the grid theme rather than hard-coding them in a component.
2. Define theme values as CSS custom properties in `grid.css` and consume them with `var(--grid-...)`.
3. Check the change with every built-in theme: `default`, `warm`, `clinical`, and `dark`.
4. Verify narrow resource columns, overlapping events, multi-resource events, and long labels in the playground.

Applications using the published package must import its compiled stylesheet once:

```tsx
import 'react-resource-calendar/styles.css';
```

Consumers do not need to install or configure Tailwind CSS.

### Building and checking changes

Type-check both workspaces:

```sh
pnpm typecheck
```

Build the library and playground:

```sh
pnpm build
```

Run both checks together before opening a pull request:

```sh
pnpm check
```

The library build is written to `packages/react-resource-calendar/dist`. It contains the ESM bundle, TypeScript declarations, and compiled stylesheet.

To inspect the files that would be published to npm, create a local tarball:

```sh
pnpm pack:library
```

There is not yet an automated unit-test suite. Until one is added, `pnpm check` and manual verification in the playground are the required checks. Bug fixes should include a reproducible playground case where practical.

## Contributing

Issues and pull requests are welcome. Please keep contributions focused on the resource-grid component rather than application-specific booking workflows.

### Before starting

- Search existing issues and pull requests to avoid duplicating work.
- Open an issue before making a large API or architectural change.
- For bugs, include a minimal data set that reproduces the problem: resources, events, date ranges, and the relevant grid options.
- Explain expected and actual behaviour. Screenshots are useful for layout problems, but should accompany reproducible data rather than replace it.

### Making a change

1. Fork the repository and create a branch from `main`.
2. Install dependencies with `pnpm install`.
3. Make the smallest change that solves the problem.
4. Exercise the change in `apps/playground`.
5. Update public types and the package README when behaviour or API changes.
6. Run `pnpm check` before committing.

Avoid unrelated formatting or refactoring in the same pull request. Public API changes should remain backward-compatible where possible. If a breaking change is necessary, describe the migration clearly in the pull request.

### Code guidelines

- Keep the package controlled: resources and events remain owned by the consumer.
- Keep domain-specific concepts out of the core types unless they apply to resource scheduling generally.
- Preserve generic typing for consumer event data and resource metadata.
- Do not access browser globals during module initialization.
- Maintain keyboard behaviour and accessible labels when changing interactive elements.
- Prefer existing theme tokens over literal colours.
- Add dependencies only when the functionality cannot be implemented reasonably with the current stack.

### Pull requests

A pull request should include:

- A short explanation of the problem and the chosen solution
- The issue it addresses, when applicable
- Steps or sample data used to verify the change
- Screenshots for visible changes
- Documentation updates for changes to public behaviour

Maintainers may ask for a change to be split if it combines unrelated work. A contribution is ready to merge when the type-check and builds pass, the playground demonstrates the intended behaviour, and the public documentation is accurate.

## License

React Resource Calendar is available under the MIT License.
