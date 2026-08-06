import logo from '@/../images/brand/averose-logo-256.webp';

export default function AppLogo() {
    return (
        <img
            src={logo}
            alt="AveRose"
            width={256}
            height={88}
            className="h-11 w-auto max-w-44 rounded-md object-contain drop-shadow-[0_0_10px_rgba(15,143,122,0.55)]"
        />
    );
}
