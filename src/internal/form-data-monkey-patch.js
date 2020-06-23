import isFunction from 'lodash/isFunction';
import IsomorphicFormData from 'isomorphic-form-data';

// patches FormData type by mutating it.
// patch :: FormData -> PatchedFormData
export const patch = (FormData) => {
  const createEntry = (field, value) => ({ name: field, value });
  /** We return original type if prototype already contains one of methods we're trying to patch.
   * Reasoning: if one of the methods already exists, it would access data in other
   * property than our `_entryList`. That could potentially create nasty
   * hardly detectable bugs if `form-data` library implements only couple of
   * methods that it misses, instead of implementing all of them.
   * Current solution will fail the tests to let us know that form-data library
   * already implements some of the methods that we try to monkey-patch, and our
   * monkey-patch code should then compensate the library changes easily.
   */
  if (
    isFunction(FormData.prototype.set)
    || isFunction(FormData.prototype.get)
    || isFunction(FormData.prototype.getAll)
    || isFunction(FormData.prototype.has)
  ) {
    return FormData;
  }
  class PatchedFormData extends FormData {
    constructor(form) {
      super(form);
      this.entryList = [];
    }

    append(field, value, options) {
      this.entryList.push(createEntry(field, value));
      return super.append(field, value, options);
    }

    set(field, value) {
      const newEntry = createEntry(field, value);

      this.entryList = this.entryList.filter((entry) => {
        return entry.name !== field;
      });

      this.entryList.push(newEntry);
    }

    get(field) {
      const foundEntry = this.entryList.find((entry) => {
        return entry.name === field;
      });

      return foundEntry === undefined ? null : foundEntry;
    }

    getAll(field) {
      return this.entryList
        .filter((entry) => {
          return entry.name === field;
        })
        .map((entry) => {
          return entry.value;
        });
    }

    has(field) {
      return this.entryList.some((entry) => {
        return entry.name === field;
      });
    }
  }

  return PatchedFormData;
};

export default patch(IsomorphicFormData);
