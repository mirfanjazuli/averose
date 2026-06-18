import {
    BookOpen,
    CalendarCheck,
    Clock3,
    FlaskConical,
    Microscope,
    Stethoscope,
    Target,
    Trophy,
    UserRoundCheck,
} from 'lucide-react';

export const programs = [
    {
        icon: Stethoscope,
        eyebrow: 'Program unggulan',
        title: 'Private Masuk FK',
        description:
            'Persiapan SNBP, SNBT, dan jalur mandiri kedokteran dengan strategi personal sesuai kampus tujuan.',
        tone: 'bg-primary text-primary-foreground',
    },
    {
        icon: FlaskConical,
        eyebrow: 'Kompetisi sains',
        title: 'OSN & Olimpiade',
        description:
            'Pendalaman Biologi, Kimia, Fisika, serta olimpiade kedokteran bersama mentor berpengalaman.',
        tone: 'bg-[#e7f5ef] text-[#176b52] dark:bg-primary/15 dark:text-primary',
    },
    {
        icon: BookOpen,
        eyebrow: 'Fondasi medis',
        title: 'Kedokteran Dasar',
        description:
            'Kenali dunia perkuliahan kedokteran lebih awal lewat materi interaktif yang relevan dan seru.',
        tone: 'bg-[#fef3d9] text-[#996300] dark:bg-amber-400/15 dark:text-amber-300',
    },
];

export const advantages = [
    {
        icon: UserRoundCheck,
        eyebrow: 'Belajar 1-on-1',
        title: 'Pendampingan yang benar-benar personal',
        description:
            'Mentor memahami target, gaya belajar, dan bagian materi yang perlu kamu kejar. Setiap sesi punya fokus yang jelas.',
        points: [
            'Learning plan personal',
            'Mentor sesuai kebutuhan',
            'Evaluasi progres berkala',
            'Bebas konsultasi materi',
        ],
        color: 'primary',
    },
    {
        icon: CalendarCheck,
        eyebrow: 'Jadwal fleksibel',
        title: 'Belajar mengikuti ritmemu',
        description:
            'Sekolah, organisasi, dan persiapan ujian tetap berjalan beriringan dengan jadwal yang disusun bersama.',
        points: [
            'Pilihan waktu fleksibel',
            'Kelas online interaktif',
            'Reschedule terarah',
            'Akses dari mana saja',
        ],
        color: 'amber',
    },
    {
        icon: Target,
        eyebrow: 'Strategi terukur',
        title: 'Fokus pada kampus dan targetmu',
        description:
            'Latihan disusun berdasarkan pola seleksi dan kemampuan siswa, lengkap dengan pembahasan dan strategi pengerjaan.',
        points: [
            'Tryout dan analisis',
            'Bank soal terpilih',
            'Strategi manajemen waktu',
            'Pendampingan mental',
        ],
        color: 'blue',
    },
];

export const testimonials = [
    {
        initials: 'AM',
        name: 'Azzami Mutahhari',
        school: 'MAN 1 Darussalam',
        quote: 'Setiap pertemuan interaktif dan boleh bertanya di luar jadwal. AveRose membantu aku memahami materi yang sebelumnya terasa sulit.',
    },
    {
        initials: 'KL',
        name: 'Kimberly Levina',
        school: 'Lolos Fakultas Kedokteran',
        quote: 'Belajarnya fokus, terarah, dan mentornya suportif. Aku jadi lebih percaya diri menghadapi proses seleksi masuk FK.',
    },
    {
        initials: 'RJ',
        name: 'Rania Janeeta',
        school: 'FKG Universitas Indonesia',
        quote: 'Bukan hanya pembahasan materi, aku juga dibantu menyusun strategi dan ritme belajar sampai hari ujian.',
    },
];

export const articles = [
    {
        icon: Clock3,
        category: 'Strategi belajar',
        title: 'Cara menyusun ritme belajar SNBT tanpa cepat burnout',
        description:
            'Mulai dari target mingguan, prioritas materi, hingga waktu evaluasi.',
    },
    {
        icon: Microscope,
        category: 'Dunia kedokteran',
        title: 'Apa yang perlu disiapkan sebelum memilih Fakultas Kedokteran?',
        description:
            'Kenali tuntutan akademik dan kebiasaan belajar yang akan kamu butuhkan.',
    },
    {
        icon: Trophy,
        category: 'Olimpiade',
        title: 'Latihan soal HOTS yang efektif untuk persiapan OSN',
        description:
            'Bukan soal banyaknya latihan, tetapi bagaimana kamu membaca pola.',
    },
];
