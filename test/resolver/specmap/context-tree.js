import ContextTree from '../../../src/resolver/specmap/lib/context-tree.js';

describe('ContextTree', () => {
  test('should set and get a deep value', () => {
    const tree = new ContextTree();
    tree.set(['one', 'two'], { one: 1 });
    const res = tree.get(['one', 'two']);
    expect(res.one).toEqual(1);
  });

  test('should set/get the root value', () => {
    const tree = new ContextTree();
    tree.set([], { one: 1 });
    const res = tree.get([]);
    expect(res.one).toEqual(1);
  });

  test('should set/get parent value without changing the children', () => {
    const tree = new ContextTree();
    tree.set(['one'], { one: 1 });
    tree.set(['one', 'two'], { two: 2 });
    expect(tree.get(['one']).one).toEqual(1);
    expect(tree.get(['one', 'two']).two).toEqual(2);

    tree.set(['one'], { alsoOne: 1 });
    expect(tree.get(['one']).alsoOne).toEqual(1);
    expect(tree.get(['one', 'two']).two).toEqual(2);
  });

  test('should not override the root parent', () => {
    const tree = new ContextTree();
    tree.set(['one', 'two'], { two: 2 });
    tree.set([], { root: 'rooty' });
    expect(tree.get(['one', 'two']).two).toEqual(2);
    expect(tree.get([]).root).toEqual('rooty');
    expect(tree.get(['one', 'two']).root).toEqual('rooty');
  });

  test('should retrieve root after setting a sibling', () => {
    const tree = new ContextTree();
    tree.set([], { baseDoc: 'rooty' });
    tree.set(['one', 'two', 'four'], { two: 2 });
    expect(tree.get(['one', 'three', 'four']).baseDoc).toEqual('rooty');
  });

  test('should allow setting the root from contructor and get without arg, returns root', () => {
    const tree = new ContextTree({ two: 2 });
    const res = tree.get();
    expect(res).toEqual({ two: 2 });
  });

  test('should get the nearest path', () => {
    const tree = new ContextTree();
    tree.set(['one', 'two'], { two: 2 });
    expect(tree.get(['one', 'two', 'three', 'four']).two).toEqual(2);
  });

  test('should return a value that inherits from the parents', () => {
    const tree = new ContextTree();
    tree.set(['one'], { one: 1 });
    tree.set(['one', 'two'], { two: 2 });
    tree.set(['one', 'two', 'three'], { three: 3 });
    const res = tree.get(['one', 'two', 'three']);
    expect(res.one).toEqual(1);
    expect(res.two).toEqual(2);
    expect(res.three).toEqual(3);
  });
});
