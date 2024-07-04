export function getFaPrefix(icon?: string) {
  return 'fa-light' + (icon ? ` ${icon}` : '');
}
