import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function focusRing(visible = true): string {
  return visible ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2' : '';
}

export function smoothScrollTo(element: HTMLElement, options?: ScrollToOptions) {
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
    ...options,
  });
}

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

export function getOS(): 'mac' | 'windows' | 'linux' | 'ios' | 'android' | 'other' {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('mac')) return 'mac';
  if (ua.includes('win')) return 'windows';
  if (ua.includes('linux')) return 'linux';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
  if (ua.includes('android')) return 'android';
  return 'other';
}

export function isMac(): boolean {
  return getOS() === 'mac';
}

export function formatShortcut(key: string): string {
  const mac = isMac();
  const parts = key.toLowerCase().split('+');
  return parts
    .map((part) => {
      switch (part) {
        case 'mod':
        case 'cmd':
        case 'command':
          return mac ? '⌘' : 'Ctrl';
        case 'ctrl':
          return mac ? '⌃' : 'Ctrl';
        case 'alt':
        case 'option':
          return mac ? '⌥' : 'Alt';
        case 'shift':
          return mac ? '⇧' : 'Shift';
        case 'enter':
          return '↵';
        case 'backspace':
          return '⌫';
        case 'escape':
        case 'esc':
          return 'Esc';
        case 'tab':
          return 'Tab';
        case 'up':
          return '↑';
        case 'down':
          return '↓';
        case 'left':
          return '←';
        case 'right':
          return '→';
        case 'space':
          return '␣';
        default:
          return part.length === 1 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1);
      }
    })
    .join(mac ? '' : '+');
}
