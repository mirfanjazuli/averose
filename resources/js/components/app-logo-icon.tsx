import type { ImgHTMLAttributes } from 'react';

import logo from '@/../images/brand/averose-logo-256.webp';
import { cn } from '@/lib/utils';

export default function AppLogoIcon(
    props: ImgHTMLAttributes<HTMLImageElement>,
) {
    return (
        <img
            {...props}
            src={logo}
            alt={props.alt ?? 'AveRose'}
            width={256}
            height={88}
            className={cn(
                'object-contain drop-shadow-[0_0_10px_rgba(15,143,122,0.55)]',
                props.className,
            )}
        />
    );
}
