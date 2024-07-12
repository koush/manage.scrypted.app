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
    }
  }
  return faPrefix + (icon ? ` ${icon}` : '');
}

export function setFaPrefix(prefix: string) {
  faPrefix = prefix;
}
