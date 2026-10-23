import { icons, type IconName } from '@/lib/icons.generated';

interface IconProps {
  name: IconName;
  size?: number;
  class?: string;
}

export function Icon({ name, size = 16, class: className }: IconProps) {
  const { body, width, height } = icons[name];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      class={className}
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}
