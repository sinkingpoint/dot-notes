import NestedList from "./nested_list"

test('NestedList adds in root', () => {
  const data = new NestedList();
  data.push([0], 1); // First always ends up at 0
  data.push([0], 2); // Second gets added at 1
  data.push([0], 3); // Third will get added at 1 and pust the second to 2

  expect(data.data[0]).toBe(1); 
  expect(data.get([0])).toBe(1);
  expect(data.data[1]).toBe(3);
  expect(data.get([1])).toBe(3);
  expect(data.data[2]).toBe(2);
  expect(data.get([2])).toBe(2);
});

test('NestedList adds in nested', () => {
  const data = new NestedList();

  // data: []

  data.push([0], [[[]]]); // First let's push some nesting

  // data: 
  // [
  //   [
  //     [
  //       []
  //     ]
  //   ]
  // ]

  data.push([0, 0, 0, 0], 1);

  // data: 
  // [
  //   [
  //     [
  //       [1]
  //     ]
  //   ]
  // ]

  data.push([0, 1], 2);

  // data: 
  // [
  //   [
  //     [
  //       [1]
  //     ],
  //     2
  //   ]
  // ]

  data.push([0, 1], []);

  // data: 
  // [
  //   [
  //     [
  //       [1]
  //     ],
  //     2,
  //     []
  //   ]
  // ]

  data.push([0, 2, 0], 3);

  // data: 
  // [
  //   [
  //     [
  //       [1]
  //     ],
  //     2,
  //     [3]
  //   ]
  // ]

  expect(data.data[0][0][0][0]).toBe(1);
  expect(data.get([0, 0, 0, 0])).toBe(1);
  expect(data.data[0][1]).toBe(2);
  expect(data.get([0, 1])).toBe(2);
  expect(data.data[0][2][0]).toBe(3);
  expect(data.get([0, 2, 0])).toBe(3);
});


test('NestedList sets', () => {
  const data = new NestedList();

  // data: []

  data.push([0], [[[]]]); // First let's push some nesting

  data.push([0, 0, 0, 0], 1);
  data.push([0, 1], 2);
  data.push([0, 1], []);
  data.push([0, 2, 0], 3);

  data.set([0, 2, 0], 5);

  expect(data.data[0][0][0][0]).toBe(1); 
  expect(data.data[0][1]).toBe(2);
  expect(data.data[0][2][0]).toBe(5);
});