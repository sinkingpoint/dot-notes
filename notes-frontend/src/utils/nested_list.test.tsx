import NestedList from "./nested_list"

test('NestedList adds in root', () => {
  const data = new NestedList();
  data.push([0], 1); // First always ends up at 0
  data.push([0], 2); // Second gets added at 1
  data.push([0], 3); // Third will get added at 1 and pust the second to 2

  expect(data.get([0])).toBe(1);
  expect(data.get([1])).toBe(3);
  expect(data.get([2])).toBe(2);
});

test('NestedList adds in nested', () => {
  const data = new NestedList();

  data.push([0], new NestedList(new NestedList(new NestedList())));
  data.push([0, 0, 0, 0], 1);
  data.push([0, 1], 2);
  data.push([0, 1], new NestedList());
  data.push([0, 2, 0], 3);

  expect(data.get([0, 0, 0, 0])).toBe(1);
  expect(data.get([0, 1])).toBe(2);
  expect(data.get([0, 2, 0])).toBe(3);
});


test('NestedList sets', () => {
  const data = new NestedList();

  data.push([0], new NestedList(new NestedList(new NestedList()))); // First let's push some nesting

  data.push([0, 0, 0, 0], 1);
  data.push([0, 1], 2);
  data.push([0, 1], new NestedList());
  data.push([0, 2, 0], 3);

  data.set([0, 2, 0], 5);

  expect(data.get([0, 0, 0, 0])).toBe(1);
  expect(data.get([0, 1])).toBe(2);
  expect(data.get([0, 2, 0])).toBe(5);
});

test('NestedList Deletes', () => {
  const data = new NestedList();
  expect(() => data.delete([-1])).toThrow();
  expect(() => data.delete([1])).toThrow();
  data.push([0], 0);
  data.push([0], new NestedList());
  data.push([1, 0], 1);

  // List should be [0, [1]]
  expect(() => data.delete([0, 1])).toThrow();

  expect(data.get([0])).toBe(0);
  expect(data.get([1, 0])).toBe(1);

  data.delete([1, 0]);

  // List should be [0] - should have removed the now empty child array
  expect(data.get([0])).toBe(0);
});

test('NestedList Constructs From Exising', () => {
  const data = new NestedList([0, [1, [2, [3]]]]);

  expect(data.get([0])).toBe(0);
  expect(data.get([1, 0])).toBe(1);
  expect(data.get([1, 1, 0])).toBe(2);
  expect(data.get([1, 1, 1, 0])).toBe(3);
});

test('NestedList Nests', () => {
  const data = new NestedList([0, 1, 2, 3]);
  data.nest([1]);

  // data should be [0, [1], 2, 3]
  expect(data.get([1, 0])).toBe(1);

  data.nest([0]);
  // data should be [[0, 1], 2, 3]
  expect(data.get([0, 1])).toBe(1);

  data.nest([1]);
  // data should be [[0, 1, 2], 3]
  data.nest([1]);
  // data should be [[0, 1, 2, 3]]
  expect(data.get([0, 1])).toBe(1);
  expect(data.get([0, 2])).toBe(2);
  expect(data.get([0, 3])).toBe(3);

  // Make sure you can't nest things that don't exist
  expect(() => data.nest([1])).toThrow();
  expect(() => data.nest([-1])).toThrow();

  data.nest([0, 0]);
  // data should be [[[0], 1, 2, 3]]
  expect(data.get([0, 0, 0])).toBe(0);

  // Test you can't nest non list container ([0, 1] == 1, this should throw on the attempt to descend into it)
  expect(() => data.nest([0, 1, 0])).toThrow();
  expect(() => data.nest([0, 1, 0, 0])).toThrow();

  data.nest([0, 2]);
  // data should be [[[0], 1, [2], 3]]
  expect(data.get([0, 2, 0])).toBe(2);

  // Test nest of element in the middle of two lists merges them
  data.nest([0, 1]);
  expect(data.get([0, 0, 0])).toBe(0);
  expect(data.get([0, 0, 1])).toBe(1);
  expect(data.get([0, 0, 2])).toBe(2);

});

test('NestedList Unnests', () => {
  const data = new NestedList([[[0], 1, 2, 3]]);
  // Test you can't unnest non list container ([0, 1] == 1, this should throw on the attempt to descend into it)
  expect(() => data.unnest([0, 1, 0])).toThrow();
  expect(() => data.unnest([0, 1, 0, 0])).toThrow();

  data.unnest([0, 0, 0]);
  // data should be [[0, 1, 2, 3]]
  expect(data.get([0, 0])).toBe(0);
  expect(data.get([0, 1])).toBe(1);
  expect(data.get([0, 2])).toBe(2);
  expect(data.get([0, 3])).toBe(3);

  // Test that unnesting a middle entry fails (for now)
  expect(() => data.unnest([0, 1])).toThrow();

  data.unnest([0, 3]);
  // data should be [[0, 1, 2], 3]
  expect(data.get([0, 0])).toBe(0);
  expect(data.get([0, 1])).toBe(1);
  expect(data.get([0, 2])).toBe(2);
  expect(data.get([1])).toBe(3);

  data.unnest([0, 0]);
  // data should be [0, [1, 2], 3]
  expect(data.get([0])).toBe(0);
  expect(data.get([1, 0])).toBe(1);
  expect(data.get([1, 1])).toBe(2);
  expect(data.get([2])).toBe(3);

  // Test you can't unnest the base layer
  expect(() => data.unnest([0])).toThrow();
})