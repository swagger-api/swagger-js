import lib from '../../../src/resolver/specmap/lib/index.js';

describe('lib', () => {
  describe('applyPatch', () => {
    test('should add', () => {
      const state = { one: 1 };
      lib.applyPatch(state, lib.add(['two'], 2));
      expect(state).toEqual({
        one: 1,
        two: 2,
      });
    });

    // describe.skip('need to migrate these tests', function () {
    //   it.skip('should NOT add, deep', function () {
    //     let state = {one: 1}
    //     state = expect(() => {
    //       lib.applyPatch(state, lib.add(['middle', 'deep'], {yay: true}))
    //     }).toThrow()
    //   })
    //
    //   it('should replace', function () {
    //     let state = {one: 1}
    //     state = lib.applyPatch(state, lib.replace(['one'], {yay: true}))
    //     expect(state.toJS()).toEqual({
    //       one: {yay: true}
    //     })
    //   })
    //
    //   it('should remove', function () {
    //     let state = makeState.set({one: 1, deep: {two: 2}})
    //     state = lib.applyFreezerPatch(state, lib.remove(['deep', 'two']))
    //     expect(state.toJS()).toEqual({
    //       one: 1,
    //       deep: {}
    //     })
    //   })
    //
    //   it('should not hold onto pivot, if remove path does not exist', function () {
    //     let state = makeState.set({one: 1, deep: {two: 2, deeper: {three: 3}}})
    //     state = lib.applyFreezerPatch(state, lib.remove(['deep', 'deeper', 'four']))
    //     expect(state.toJS()).toEqual(state.toJS())
    //
    //     state = lib.applyFreezerPatch(state, lib.add(['deep', 'deeper', 'four'], 4))
    //     expect(state.toJS()).toEqual({one: 1, deep: {two: 2, deeper: {three: 3, four: 4}}})
    //
    //   })
    //
    //   it('should merge, shallow', function () {
    //     let state = makeState.set({one: 1, deep: {two: 2}})
    //     state = lib.applyFreezerPatch(state, lib.merge(['deep'], {three: 3, four: 4}))
    //     expect(state.toJS()).toEqual({
    //       one: 1,
    //       deep: {
    //         two: 2,
    //         three: 3,
    //         four: 4
    //       }
    //     })
    //
    //   })
    //
    //   it('should merge into arrays', function () {
    //     let state = makeState.set({
    //       arr: [
    //         { one: 1 }
    //       ]
    //     })
    //     state = lib.applyFreezerPatch(state, lib.merge(['arr', 0], {two: 2, three: 3}))
    //     expect(state.toJS()).toEqual({
    //       arr: [
    //         { one:1, two: 2, three: 3}
    //       ]
    //     })
    //   })
    //
    //   it('can merge with root', function () {
    //     let state = makeState
    //     state = lib.applyFreezerPatch(state, lib.merge([], {three: 3}))
    //     expect(state.toJS()).toEqual({
    //       three: 3
    //     })
    //   })
    // })
  });

  describe('parentPathMatch', () => {
    test('should match an exact path', () => {
      expect(lib.parentPathMatch(['one', 'two'], ['one', 'two'])).toEqual(true);
    });

    test('should NOT match a child path', () => {
      expect(lib.parentPathMatch(['one', 'two'], ['one', 'two', 'three'])).toEqual(false);
    });

    test('should match a parent path', () => {
      expect(lib.parentPathMatch(['one', 'two'], ['one'])).toEqual(true);
    });
  });
});
