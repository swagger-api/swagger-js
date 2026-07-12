export default function idFromPathMethodLegacy(pathName, method) {
  return `${method.toLowerCase()}-${pathName}`;
}