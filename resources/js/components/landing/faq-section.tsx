import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

const faqs = [
    {
        answer: 'Ya. Kelas AveRose dilakukan secara privat 1-on-1 agar mentor bisa fokus pada kebutuhan, ritme, dan target belajar siswa.',
        question: 'Apakah kelas dilakukan secara privat?',
    },
    {
        answer: 'Ya. Jadwal belajar bisa disesuaikan dengan aktivitas sekolah, persiapan lomba, atau agenda kampus selama slot mentor tersedia.',
        question: 'Apakah jadwal belajar fleksibel?',
    },
    {
        answer: 'Bisa. Jika kebutuhan belajar siswa berubah atau perlu kecocokan gaya mengajar yang berbeda, tim AveRose dapat membantu evaluasi mentor.',
        question: 'Apakah mentor dapat diganti?',
    },
    {
        answer: 'Materi dapat mengikuti kebutuhan siswa, baik materi sekolah, target masuk FK, olimpiade sains, maupun perkuliahan kedokteran.',
        question: 'Apakah materi mengikuti sekolah atau kampus?',
    },
    {
        answer: 'Tersedia. Experience class membantu siswa dan orang tua merasakan alur belajar sebelum menentukan program lanjutan.',
        question: 'Apakah tersedia trial class?',
    },
    {
        answer: 'Kelas dapat memiliki rekaman jika sesi dilakukan melalui sistem meeting yang mendukung perekaman dan sesuai persetujuan pembelajaran.',
        question: 'Apakah kelas mendapatkan rekaman?',
    },
    {
        answer: 'Program terbaik ditentukan dari level siswa saat ini, target yang ingin dicapai, waktu persiapan, dan kebutuhan materi prioritas.',
        question: 'Program apa yang sesuai untuk siswa saya?',
    },
    {
        answer: 'Jumlah sesi ditentukan dari hasil pemetaan kebutuhan, kedalaman materi, frekuensi belajar, dan target waktu yang ingin dicapai.',
        question: 'Bagaimana cara menentukan jumlah sesi?',
    },
];

export default function FaqSection() {
    const [openQuestion, setOpenQuestion] = useState(faqs[0].question);

    return (
        <section
            id="faq"
            className="scroll-mt-16 bg-[#f8fbfa] py-16 sm:scroll-mt-20 sm:py-24 lg:py-28"
        >
            <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:gap-16 lg:px-10">
                <div className="lg:sticky lg:top-28">
                    <h2 className="mt-4 max-w-xl font-heading text-4xl leading-tight font-semibold tracking-tight text-balance text-[#102a3a] sm:text-5xl">
                        Hal yang paling sering ditanyakan.
                    </h2>
                </div>

                <div className="grid gap-4">
                    {faqs.map((faq) => {
                        const isOpen = openQuestion === faq.question;

                        return (
                            <Collapsible
                                key={faq.question}
                                open={isOpen}
                                onOpenChange={(open) =>
                                    setOpenQuestion(open ? faq.question : '')
                                }
                                className="rounded-[1.35rem] border border-[#dcece7] bg-white px-5 shadow-sm shadow-[#102a3a]/[0.03] transition hover:border-[#0f8f7a]/35 sm:rounded-[1.5rem]"
                            >
                                <CollapsibleTrigger className="flex w-full items-center justify-between gap-5 py-5 text-left">
                                    <span className="text-sm font-semibold text-[#102a3a] sm:text-base">
                                        {faq.question}
                                    </span>
                                    <ChevronDown
                                        className={`size-5 shrink-0 text-[#0f8f7a] transition-transform duration-300 ${
                                            isOpen ? 'rotate-180' : ''
                                        }`}
                                    />
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <p className="pb-5 text-sm leading-6 text-[#526b7b]">
                                        {faq.answer}
                                    </p>
                                </CollapsibleContent>
                            </Collapsible>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
