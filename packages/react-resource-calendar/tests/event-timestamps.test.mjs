import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getEventAbsoluteTimestamps,
  getEventTimeInfo,
  computeGridColumnLayout,
  computeGridContinuousColumnLayout,
  computeGridDiscreteSectionLayout,
} from '../dist/index.js';

const event = (startsAt, endsAt, id = 'booking') => ({
  id, title: 'Booking', resourceIds: ['room'], startsAt, endsAt,
});

test('Date and offset ISO inputs resolve to the same instants and local labels', () => {
  const iso = event('2026-09-05T09:30:00+02:00', '2026-09-05T11:00:00+02:00');
  const dates = event(new Date(iso.startsAt), new Date(iso.endsAt));
  assert.deepEqual(getEventAbsoluteTimestamps(iso), getEventAbsoluteTimestamps(dates));
  assert.deepEqual(getEventTimeInfo(iso), getEventTimeInfo(dates));
  assert.equal(getEventAbsoluteTimestamps(iso).startMs, Date.parse('2026-09-05T07:30:00Z'));
});

test('missing, legacy-only, invalid, zero-length, and reversed ranges are rejected', () => {
  for (const item of [
    { id: 'legacy', date: '2026-09-05', startTime: '09:00', endTime: '10:00' },
    event(undefined, '2026-09-05T10:00:00'),
    event('2026-09-05', '2026-09-05T10:00:00'),
    event(new Date(NaN), new Date()),
    event('invalid', '2026-09-05T10:00:00'),
    event('2026-09-05T10:00:00', '2026-09-05T10:00:00'),
    event('2026-09-05T10:00:00', '2026-09-05T09:00:00'),
  ]) assert.throws(() => getEventAbsoluteTimestamps(item), RangeError);
});

test('overnight timestamps retain duration and clip correctly on the following day', () => {
  const item = event('2026-09-05T23:00:00', '2026-09-06T02:00:00');
  const continuous = computeGridContinuousColumnLayout(
    [item], 'room', new Date('2026-09-05T22:00:00'), new Date('2026-09-06T03:00:00'), 1,
  );
  assert.equal(continuous[0].layout.topPx, 60);
  assert.equal(continuous[0].layout.heightPx, 180);
  const column = computeGridColumnLayout([item], '2026-09-06', 'room', 0, 24, 1);
  assert.equal(column[0].layout.topPx, 0);
  assert.equal(column[0].layout.heightPx, 120);
  const discrete = computeGridDiscreteSectionLayout(
    [item], [{ id: 'room', label: 'Room' }], '2026-09-06', 0, 24, 80, 180, 1,
  );
  assert.equal(discrete[0].layout.topPx, 0);
  assert.equal(discrete[0].layout.heightPx, 120);
});

test('conflicts use absolute ranges while adjacent events do not conflict', () => {
  const items = [
    event('2026-09-05T23:00:00', '2026-09-06T02:00:00', 'overnight'),
    event('2026-09-06T01:00:00', '2026-09-06T02:00:00', 'overlap'),
    event('2026-09-06T02:00:00', '2026-09-06T03:00:00', 'adjacent'),
  ];
  const layouts = computeGridColumnLayout(items, '2026-09-06', 'room', 0, 24, 1);
  assert.deepEqual(layouts.map(({ layout }) => layout.hasConflict), [true, true, false]);
});
