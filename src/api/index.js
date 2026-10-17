// Every screen talks to the backend only through `api` (see ./real.js for the
// endpoint mapping and ./adapters.js for payload -> UI shape conversion).
export { real as api } from './real'
