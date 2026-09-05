import assert from 'node:assert/strict';
import test from 'node:test';
import { groupContinuousDateRanges, getEffectiveRangeBounds, ResourceColumn, computeGridContinuousSectionLayout } from '../dist/index.js';
const range = (start, end) => ({ startsAt: new Date(start), endsAt: new Date(end) });

test('partial-hour bounds, row heights, event positions and clicks share exact timestamps', () => {
  const window = range('2026-09-05T08:30:00', '2026-09-05T10:10:00');
  const [group] = groupContinuousDateRanges([window], 60);
  assert.deepEqual(getEffectiveRangeBounds(window), { start: window.startsAt, end: window.endsAt });
  assert.equal(group.totalMinutes, 100);
  assert.equal(group.totalHeightPx, 100);
  assert.deepEqual(group.ranges[0].rows.map(row => row.heightPx), [30, 60, 10]);
  const resource = { id: 'room', label: 'Room' };
  const [item] = computeGridContinuousSectionLayout([
    { id: 'e', title: 'Event', resourceIds: ['room'], ...range('2026-09-05T09:00:00', '2026-09-05T09:30:00') },
  ], [resource], group.start, group.end, 80, 180, 1);
  assert.equal(item.layout.topPx, 30);
  assert.equal(item.layout.heightPx, 30);
  const clicks = [];
  const column = ResourceColumn({ group, resource, events: [], pxPerMinute: 1, intervalMinutes: 15, onGridClick: info => clicks.push(info) });
  const cells = column.props.children[0];
  assert.equal(cells.reduce((sum, cell) => sum + cell.props.height, 0), 100);
  assert.equal(cells.at(-1).props.height, 10);
  cells.forEach(cell => cell.props.onClick());
  assert.equal(clicks[0].date.getTime(), window.startsAt.getTime());
  assert.equal(clicks.at(-1).time, '10:00');
  assert.equal(clicks.at(-1).minutesFromStart, 90);
});

test('overnight and multi-day windows split at midnight without losing duration', () => {
  const [group] = groupContinuousDateRanges([range('2026-09-05T23:30:00', '2026-09-07T00:15:00')], 60);
  assert.equal(group.totalMinutes, 1485);
  assert.deepEqual(group.ranges.map(r => r.heightPx), [30, 1440, 15]);
  assert.deepEqual(group.ranges.map(r => r.offsetPxFromGroupStart), [0, 30, 1470]);
});

test('ranges sort without mutation, join exact boundaries and preserve small gaps', () => {
  const first = range('2026-09-05T08:30:00', '2026-09-05T09:00:00');
  const second = range('2026-09-05T09:00:00', '2026-09-05T09:30:00');
  const third = range('2026-09-05T09:30:00.500', '2026-09-05T10:00:00');
  const inputs = [third, second, first];
  const groups = groupContinuousDateRanges(inputs);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].totalMinutes, 60);
  assert.equal(inputs[0], third);
  assert.equal(first.startsAt.getMinutes(), 30);
});

test('invalid, missing, reversed and overlapping date ranges fail explicitly', () => {
  for (const windows of [
    [{ startsAt: new Date(), endsAt: undefined }],
    [range('invalid', '2026-09-05T10:00:00')],
    [range('2026-09-05T10:00:00', '2026-09-05T10:00:00')],
    [range('2026-09-05T11:00:00', '2026-09-05T10:00:00')],
    [range('2026-09-05T08:00:00', '2026-09-05T10:00:00'), range('2026-09-05T09:00:00', '2026-09-05T11:00:00')],
  ]) assert.throws(() => groupContinuousDateRanges(windows), RangeError);
});

test('DST transition heights follow actual elapsed hours', () => {
  for (const [start, end] of [['2026-03-08T00:00:00', '2026-03-09T00:00:00'], ['2026-11-01T00:00:00', '2026-11-02T00:00:00']]) {
    const window = range(start, end);
    const [group] = groupContinuousDateRanges([window], 60);
    const minutes = (window.endsAt - window.startsAt) / 60000;
    assert.equal(group.totalHeightPx, minutes);
    assert.equal(group.ranges.flatMap(r => r.rows).reduce((sum, row) => sum + row.heightPx, 0), minutes);
  }
});
