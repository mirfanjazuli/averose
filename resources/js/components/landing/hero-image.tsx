import type { ImgHTMLAttributes } from 'react';
import hero480 from '@/../images/landing/future-alpha-doctor-480.webp';
import hero768 from '@/../images/landing/future-alpha-doctor-768.webp';
import heroFallback from '@/../images/landing/future-alpha-doctor-864.jpg';
import hero864 from '@/../images/landing/future-alpha-doctor-864.webp';

type HeroImageProps = Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    'alt' | 'height' | 'src' | 'srcSet' | 'width'
>;

export default function HeroImage(props: HeroImageProps) {
    return (
        <picture className="contents">
            <source
                type="image/webp"
                srcSet={`${hero480} 480w, ${hero768} 768w, ${hero864} 864w`}
                sizes="(min-width: 1024px) 42vw, (min-width: 640px) 590px, 100vw"
            />
            <img
                {...props}
                src={heroFallback}
                alt="Siswa Indonesia percaya diri mempersiapkan diri menjadi calon dokter"
                width={864}
                height={1080}
            />
        </picture>
    );
}
