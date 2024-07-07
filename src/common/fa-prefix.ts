let faPrefix = 'fa-unset';
export function getFaPrefix(icon?: string) {
  return faPrefix + (icon ? ` ${icon}` : '');
}

export function setFaPrefix(prefix: string) {
  faPrefix = prefix;
}
