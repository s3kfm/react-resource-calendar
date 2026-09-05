import assert from 'node:assert/strict';
import test from 'node:test';
import { computeGridContinuousColumnLayout, computeGridContinuousSectionLayout, computeGridDiscreteSectionLayout } from '../dist/index.js';
const start = new Date('2026-09-05T08:00:00');
const end = new Date('2026-09-05T12:00:00');
const resources = ['a', 'b', 'c'].map(id => ({ id, label: id }));
const event = resourceIds => ({ id: 'event', title: 'Booking', resourceIds, startsAt: new Date('2026-09-05T09:00:00'), endsAt: new Date('2026-09-05T10:00:00') });

test('column layouts include each assigned resource and exclude unrelated columns', () => {
  for (const id of ['a', 'b']) assert.equal(computeGridContinuousColumnLayout([event(['a', 'b'])], id, start, end).length, 1);
  assert.equal(computeGridContinuousColumnLayout([event(['a', 'b'])], 'c', start, end).length, 0);
});

for (const [name, layout] of [
  ['continuous', events => computeGridContinuousSectionLayout(events, resources, start, end)],
  ['discrete', events => computeGridDiscreteSectionLayout(events, resources, '2026-09-05', 8, 12)],
]) {
  test(`${name} sections support one/many resources and deduplicate assignments`, () => {
    assert.equal(layout([event(['a'])])[0].layout.colSpan, 1);
    assert.equal(layout([event(['a', 'b', 'a'])])[0].layout.colSpan, 2);
    assert.equal(layout([event(['a', 'c'])]).length, 2);
    assert.deepEqual(layout([event([])]), []);
    assert.deepEqual(layout([event(['unknown'])]), []);
  });
}
