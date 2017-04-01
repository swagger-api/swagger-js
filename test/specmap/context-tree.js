import expect from 'expect'
import ContextTree from '../../src/specmap/lib/context-tree'

describe('ContextTree', function () {
  it('should set and get a deep value', function () {
    const tree = new ContextTree()
    tree.set(['one', 'two'], {one: 1})
    const res = tree.get(['one', 'two'])
    expect(res.one).toEqual(1)
  })

  it('should set/get the root value', function () {
    const tree = new ContextTree()
    tree.set([], {one: 1})
    const res = tree.get([])
    expect(res.one).toEqual(1)
  })

  it('should set/get parent value without changing the children', function () {
    const tree = new ContextTree()
    tree.set(['one'], {one: 1})
    tree.set(['one', 'two'], {two: 2})
    expect(tree.get(['one']).one).toEqual(1)
    expect(tree.get(['one', 'two']).two).toEqual(2)

    tree.set(['one'], {alsoOne: 1})
    expect(tree.get(['one']).alsoOne).toEqual(1)
    expect(tree.get(['one', 'two']).two).toEqual(2)
  })

  it('should not override the root parent', function () {
    const tree = new ContextTree()
    tree.set(['one', 'two'], {two: 2})
    tree.set([], {root: 'rooty'})
    expect(tree.get(['one', 'two']).two).toEqual(2)
    expect(tree.get([]).root).toEqual('rooty')
    expect(tree.get(['one', 'two']).root).toEqual('rooty')
  })

  it('should retrieve root after setting a sibling', function () {
    const tree = new ContextTree()
    tree.set([], {baseDoc: 'rooty'})
    tree.set(['one', 'two', 'four'], {two: 2})
    expect(tree.get(['one', 'three', 'four']).baseDoc).toEqual('rooty')
  })

  it('should allow setting the root from contructor and get without arg, returns root', function () {
    const tree = new ContextTree({two: 2})
    const res = tree.get()
    expect(res).toEqual({two: 2})
  })

  it('should get the nearest path', function () {
    const tree = new ContextTree()
    tree.set(['one', 'two'], {two: 2})
    expect(tree.get(['one', 'two', 'three', 'four']).two).toEqual(2)
  })

  it('should return a value that inherits from the parents', function () {
    const tree = new ContextTree()
    tree.set(['one'], {one: 1})
    tree.set(['one', 'two'], {two: 2})
    tree.set(['one', 'two', 'three'], {three: 3})
    const res = tree.get(['one', 'two', 'three'])
    expect(res.one).toEqual(1)
    expect(res.two).toEqual(2)
    expect(res.three).toEqual(3)
  })
})
