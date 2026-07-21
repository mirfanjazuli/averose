type ConnectorTone = 'soft' | 'softToWhite' | 'whiteToSoft';

const toneClassName: Record<ConnectorTone, string> = {
    soft: 'from-[#f8fbfa] via-white to-[#f8fbfa]',
    softToWhite: 'from-[#f8fbfa] via-white to-white',
    whiteToSoft: 'from-white via-white to-[#f8fbfa]',
};

export default function SectionConnector({
    tone = 'soft',
}: {
    tone?: ConnectorTone;
}) {
    return (
        <div
            aria-hidden="true"
            className={`h-16 bg-gradient-to-b sm:h-20 ${toneClassName[tone]}`}
        />
    );
}
