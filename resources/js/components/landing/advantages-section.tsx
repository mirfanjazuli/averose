import { BarChart3, CalendarClock, Map, UserCheck } from 'lucide-react';

const advantages = [
    {
        icon: UserCheck,
        title: 'Mentor 1-on-1',
        description:
            'Siswa belajar langsung dengan mentor yang sesuai target dan kebutuhan materi.',
    },
    {
        icon: Map,
        title: 'Roadmap personal',
        description:
            'Materi disusun berdasarkan posisi awal, target kampus, dan waktu persiapan.',
    },
    {
        icon: CalendarClock,
        title: 'Jadwal fleksibel',
        description:
            'Waktu belajar bisa menyesuaikan sekolah, organisasi, dan agenda ujian.',
    },
    {
        icon: BarChart3,
        title: 'Evaluasi progres',
        description:
            'Setiap sesi punya catatan perkembangan, fokus perbaikan, dan rencana berikutnya.',
    },
];

export default function AdvantagesSection() {
    return (
        <section
            id="keunggulan"
            className="scroll-mt-16 bg-white py-16 sm:scroll-mt-20 sm:py-24 lg:py-28"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
                <h2 className="mt-4 max-w-2xl font-heading text-4xl leading-tight font-semibold tracking-tight text-balance text-[#102a3a] sm:text-5xl">
                    Belajar lebih jelas, <br /> bukan sekadar lebih banyak.
                </h2>

                <div className="mt-10 grid gap-4 sm:mt-12 md:grid-cols-2 xl:grid-cols-4">
                    {advantages.map((advantage, index) => {
                        const Icon = advantage.icon;
                        const isPrimary = index === 0;

                        return (
                            <article
                                key={advantage.title}
                                className={`rounded-[1.5rem] p-6 transition duration-300 hover:-translate-y-1 ${
                                    isPrimary
                                        ? 'bg-[#0f8f7a] text-white shadow-xl shadow-[#0f8f7a]/16'
                                        : 'border border-[#dcece7] bg-[#f8fbfa] text-[#102a3a]'
                                }`}
                            >
                                <div
                                    className={`flex size-12 items-center justify-center rounded-2xl ${
                                        isPrimary
                                            ? 'bg-white/14 text-white ring-1 ring-white/18'
                                            : 'bg-white text-[#0f8f7a] ring-1 ring-[#dcece7]'
                                    }`}
                                >
                                    <Icon className="size-6" strokeWidth={1.7} />
                                </div>
                                <h3 className="mt-8 font-heading text-2xl font-semibold leading-tight">
                                    {advantage.title}
                                </h3>
                                <p
                                    className={`mt-3 text-sm leading-6 ${
                                        isPrimary
                                            ? 'text-white/74'
                                            : 'text-[#526b7b]'
                                    }`}
                                >
                                    {advantage.description}
                                </p>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
