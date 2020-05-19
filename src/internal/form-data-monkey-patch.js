import IsomorphicFormData from 'isomorphic-form-data';

// patches FormData type by mutating it.
// patch :: FormData -> PatchedFormData
export const patch = (FormData) => {
  const create_entry = (field, value) => ({ name: field, value: value });

  class PatchedFormData extends FormData {
    constructor(form) {
      super(form);
      this._entryList = [];
    }

    append(field, value, options) {
      this._entryList.push(create_entry(field, value));
      return super.append(field, value, options);
    }

    set(field, value) {
      const entry = create_entry(field, value);

      this._entryList = this._entryList.filter((entry) => {
        return entry.name !== field;
      });

      this._entryList.push(entry);
    }

    get(field) {
      const foundEntry = this._entryList.find((entry) => {
        return entry.name === field;
      });

      return foundEntry === undefined ? null : foundEntry;
    }

    getAll(field) {
      return this._entryList
        .filter((entry) => {
          return entry.name === field;
        })
        .map((entry) => {
          return entry.value;
        });
    }

    has(field) {
      return this._entryList.some((entry) => {
        return entry.name === field;
      });
    }
  }

  return PatchedFormData;
};

export default patch(IsomorphicFormData);
