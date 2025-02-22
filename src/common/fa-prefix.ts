let faPrefix = 'fa-unset';
export function getFaPrefix(icon?: string) {
  if (faPrefix === 'fa-solid' && icon) {
    switch (icon) {
      case 'fa-puzzle':
        icon = 'fa-puzzle-piece';
        break;
      case 'fa-rectangle-terminal':
        icon = 'fa-terminal';
        break;
      case 'fa-sun-bright':
        icon = 'fa-sun';
        break;
      case 'fa-moon-over-sun':
        icon = 'fa-circle';
        break;
      case 'fa-broom-wide':
        icon = 'fa-trash';
        break;
      case 'fa-chevrons-down':
        icon = 'fa-chevron-down';
        break;
      case 'fa-chevrons-up':
        icon = 'fa-chevron-up';
        break;
    }
  }
  return faPrefix + (icon ? ` ${icon}` : '');
}

export function maybeGetFaPrefix(icon: string | undefined) {
  if (!icon)
    return;
  return getFaPrefix(icon);
}

export function setFaPrefix(prefix: string) {
  faPrefix = prefix;
}
