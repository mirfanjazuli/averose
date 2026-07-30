import type { ImgHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            {...props}
            src="/images/averose-logo.png"
            alt={props.alt ?? 'AveRose'}
            className={cn(
                'object-contain drop-shadow-[0_0_10px_rgba(15,143,122,0.55)]',
                props.className,
            )}
        />
    );
}
