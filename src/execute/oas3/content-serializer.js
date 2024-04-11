/*
  Serializer that serializes according to a media type instead of OpenAPI's
  `style` + `explode` constructs.
*/

export default function serialize(value, mediaType) {
  if (mediaType.includes('application/json')) {
    if (typeof value === 'string') {
      // Assume the user has a JSON string
      return value;
    }

    if (Array.isArray(value)) {
      value = value.map((v) => {
        try {
          return JSON.parse(v);
        } catch (e) {
          return v;
        }
      });
    }

    return JSON.stringify(value);
  }

  return String(value);
}
