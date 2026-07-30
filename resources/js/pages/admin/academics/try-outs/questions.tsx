import { Form, Head, usePage } from '@inertiajs/react';
import { ImagePlus, Info, LoaderCircle, Pencil } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/admin/empty-state';
import { StatusBadge } from '@/components/admin/status-badge';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { clearTypesetMath, hasMathSource, typesetMath } from '@/lib/mathjax';
import { normalizeTryOutContentHtml } from '@/lib/try-out-content';
import { cn } from '@/lib/utils';

type TryOutQuestion = {
    answer: string | null;
    correctAnswers: string[];
    id: string;
    number: number;
    options: Record<string, string>;
    optionsHtml: Record<string, string>;
    points: number | null;
    questionType: 'single_choice' | 'multiple_answer' | 'numeric_answer';
    questionHtml: string;
    questionText: string;
    subCategoryName: string | null;
    subjectName: string | null;
};

type TryOutQuestions = {
    id: string;
    questions: TryOutQuestion[];
    questionsCount: number;
    scoringMode: 'raw_score' | 'negative_marking';
    slug: string;
    status: string;
    subjects: string[];
    title: string;
};

function waitForImages(element: HTMLElement) {
    return Promise.all(
        Array.from(element.querySelectorAll('img')).map((image) => {
            if (image.complete) {
                return image.decode?.().catch(() => undefined);
            }

            return new Promise<void>((resolve) => {
                image.addEventListener('load', () => resolve(), {
                    once: true,
                });
                image.addEventListener('error', () => resolve(), {
                    once: true,
                });
            });
        }),
    );
}

function RichContent({
    className,
    html,
    onReady,
    readyKey,
    typeset = true,
}: {
    className?: string;
    html: string;
    onReady?: (key: string) => void;
    readyKey?: string;
    typeset?: boolean;
}) {
    const contentRef = useRef<HTMLDivElement>(null);
    const containsMath = hasMathSource(html);

    useEffect(() => {
        const element = contentRef.current;

        if (!element) {
            return;
        }

        let isCurrent = true;

        const mathReady =
            containsMath && typeset ? typesetMath(element) : Promise.resolve();

        void Promise.all([mathReady, waitForImages(element)])
            .then(() => {
                if (isCurrent) {
                    if (readyKey) {
                        onReady?.(readyKey);
                    }
                }
            })
            .catch(() => {
                if (isCurrent) {
                    if (readyKey) {
                        onReady?.(readyKey);
                    }
                }
            });

        return () => {
            isCurrent = false;
            clearTypesetMath(element);
        };
    }, [containsMath, html, onReady, readyKey, typeset]);

    return (
        <div
            key={html}
            ref={contentRef}
            data-try-out-rich-content
            className={className}
            dangerouslySetInnerHTML={{
                __html: normalizeTryOutContentHtml(html),
            }}
        />
    );
}

function hasMathContent(html?: string | null) {
    return !!html && html.includes('<math');
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function mathJaxPreviewHtml(source: string) {
    if (typeof window === 'undefined') {
        return escapeHtml(source);
    }

    const document = new DOMParser().parseFromString(source, 'text/html');
    const blockedTags = [
        'base',
        'button',
        'embed',
        'form',
        'iframe',
        'input',
        'link',
        'meta',
        'object',
        'script',
        'select',
        'style',
        'textarea',
    ];

    document
        .querySelectorAll(blockedTags.join(','))
        .forEach((element) => element.remove());

    document.querySelectorAll('*').forEach((element) => {
        Array.from(element.attributes).forEach((attribute) => {
            const name = attribute.name.toLowerCase();
            const value = attribute.value.trim().toLowerCase();

            if (
                name.startsWith('on') ||
                name === 'srcdoc' ||
                value.startsWith('javascript:')
            ) {
                element.removeAttribute(attribute.name);
            }
        });
    });

    return document.body.innerHTML;
}

function richHtmlToEditableSource(html?: string | null, fallback = '') {
    if (!html || typeof window === 'undefined') {
        return fallback;
    }

    const document = new DOMParser().parseFromString(
        `<div>${html}</div>`,
        'text/html',
    );
    const root = document.body.firstElementChild;

    if (!root) {
        return fallback;
    }

    root.querySelectorAll('br').forEach((element) => {
        element.replaceWith(document.createTextNode('\n'));
    });

    root.querySelectorAll('.math-frac').forEach((element) => {
        const numerator =
            element.querySelector('.math-frac-num')?.textContent?.trim() ?? '';
        const denominator =
            element.querySelector('.math-frac-den')?.textContent?.trim() ?? '';

        if (numerator && denominator) {
            element.replaceWith(
                document.createTextNode(
                    `\\(\\frac{${numerator}}{${denominator}}\\)`,
                ),
            );
        }
    });

    root.querySelectorAll('math').forEach((element) => {
        const tex = mathMlToTex(element).trim();

        if (tex) {
            element.replaceWith(document.createTextNode(`\\(${tex}\\)`));
        }
    });

    return root.innerHTML.trim() || fallback;
}

function ImageUploadButton({
    onUploaded,
    tryOutSlug,
}: {
    onUploaded: (html: string) => void;
    tryOutSlug: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const upload = async (file?: File) => {
        if (!file) {
            return;
        }

        const csrfToken = document
            .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.getAttribute('content');
        const body = new FormData();
        body.append('image', file);
        setUploading(true);

        try {
            const response = await fetch(
                `/academics/try-outs/${tryOutSlug}/assets`,
                {
                    method: 'POST',
                    body,
                    credentials: 'same-origin',
                    headers: {
                        Accept: 'application/json',
                        ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                    },
                },
            );
            const payload = (await response.json()) as {
                message?: string;
                url?: string;
            };

            if (!response.ok || !payload.url) {
                throw new Error(payload.message || 'Image upload failed.');
            }

            const alt = file.name
                .replace(/\.[^.]+$/, '')
                .replace(/["<>]/g, '')
                .slice(0, 255);
            onUploaded(
                `<img src="${payload.url}" alt="${alt}" loading="lazy" decoding="async">`,
            );
            toast.success('Image uploaded.');
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : 'Image upload failed.',
            );
        } finally {
            setUploading(false);

            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
    };

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => void upload(event.target.files?.[0])}
            />
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
            >
                {uploading ? (
                    <LoaderCircle className="size-4 animate-spin" />
                ) : (
                    <ImagePlus className="size-4" />
                )}
                Add image
            </Button>
        </>
    );
}

function mathMlToTex(node: Element): string {
    const children = Array.from(node.children);
    const childTex = () => children.map(mathMlToTex).join('');
    const childAt = (index: number) => {
        const child = children[index];

        return child ? mathMlToTex(child) : '';
    };

    switch (node.localName) {
        case 'math':
        case 'mrow':
        case 'semantics':
            return childTex();
        case 'mfrac':
            return `\\frac{${childAt(0)}}{${childAt(1)}}`;
        case 'msqrt':
            return `\\sqrt{${childTex()}}`;
        case 'mroot':
            return `\\sqrt[${childAt(1)}]{${childAt(0)}}`;
        case 'msub':
            return `${childAt(0)}_{${childAt(1)}}`;
        case 'msup':
            return `${childAt(0)}^{${childAt(1)}}`;
        case 'msubsup':
            return `${childAt(0)}_{${childAt(1)}}^{${childAt(2)}}`;
        case 'mover':
            return `${childAt(0)}^{${childAt(1)}}`;
        case 'munder':
            return `${childAt(0)}_{${childAt(1)}}`;
        case 'munderover':
            return `${childAt(0)}_{${childAt(1)}}^{${childAt(2)}}`;
        case 'mi':
        case 'mn':
        case 'mo':
        case 'mtext':
            return normalizeMathText(node.textContent ?? '');
        default:
            return node.textContent ? normalizeMathText(node.textContent) : '';
    }
}

function normalizeMathText(value: string) {
    return value
        .replace(/−/g, '-')
        .replace(/×/g, '\\times ')
        .replace(/÷/g, '\\div ')
        .replace(/≤/g, '\\le ')
        .replace(/≥/g, '\\ge ')
        .replace(/≠/g, '\\ne ')
        .trim();
}

export default function AdminTryOutQuestions({
    tryOut,
}: {
    tryOut: TryOutQuestions;
}) {
    const page = usePage<{
        flash?: {
            success?: string;
        };
    }>();
    const [editingQuestion, setEditingQuestion] =
        useState<TryOutQuestion | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [questionSource, setQuestionSource] = useState('');
    const [optionSources, setOptionSources] = useState<Record<string, string>>(
        {},
    );
    const [activeQuestionId, setActiveQuestionId] = useState<string | null>(
        tryOut.questions[0]?.id ?? null,
    );
    const questionListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!page.props.flash?.success) {
            return;
        }

        toast.success(page.props.flash.success);
    }, [page.props.flash?.success]);

    useEffect(() => {
        const element = questionListRef.current;

        if (!element || !hasMathSource(element.innerHTML)) {
            return;
        }

        void typesetMath(element).catch((error: unknown) => {
            console.error('MathJax failed to render try out questions.', error);
        });

        return () => {
            clearTypesetMath(element);
        };
    }, [tryOut.questions]);

    useEffect(() => {
        const element = questionListRef.current;

        if (!element) {
            return;
        }

        const sections = Array.from(
            element.querySelectorAll<HTMLElement>('[data-question-id]'),
        );

        if (sections.length === 0) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const visibleEntry = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort(
                        (first, second) =>
                            first.boundingClientRect.top -
                            second.boundingClientRect.top,
                    )[0];

                if (visibleEntry?.target instanceof HTMLElement) {
                    setActiveQuestionId(
                        visibleEntry.target.dataset.questionId ?? null,
                    );
                }
            },
            {
                rootMargin: '-20% 0px -70% 0px',
                threshold: 0,
            },
        );

        sections.forEach((section) => observer.observe(section));

        return () => {
            observer.disconnect();
        };
    }, [tryOut.questions]);

    const closeEditingQuestion = useCallback(() => {
        setEditDialogOpen(false);
        setEditingQuestion(null);
    }, []);

    const startEditingQuestion = (question: TryOutQuestion) => {
        setEditingQuestion(question);
        setQuestionSource(
            richHtmlToEditableSource(
                question.questionHtml,
                question.questionText,
            ),
        );
        setOptionSources(
            Object.fromEntries(
                ['A', 'B', 'C', 'D', 'E'].map((optionKey) => [
                    optionKey,
                    richHtmlToEditableSource(
                        question.optionsHtml[optionKey],
                        question.options[optionKey] ?? '',
                    ),
                ]),
            ),
        );
        setEditDialogOpen(true);
    };

    const scrollToQuestion = (question: TryOutQuestion) => {
        setActiveQuestionId(question.id);
        document
            .getElementById(`question-${question.id}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <>
            <Head title={`${tryOut.title} Questions`} />
            <div className="flex h-full max-w-full min-w-0 flex-1 flex-col gap-6 overflow-hidden p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="font-heading text-2xl font-semibold">
                                Questions
                            </h1>
                            <StatusBadge status={tryOut.status} />
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {tryOut.title}
                        </p>
                    </div>
                </div>

                {tryOut.questions.length === 0 ? (
                    <EmptyState>No questions available.</EmptyState>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[12rem_minmax(0,1fr)]">
                        <aside className="lg:sticky lg:top-4 lg:self-start">
                            <div className="scrollbar-stable max-h-[calc(100vh-8rem)] overflow-y-auto rounded-xl border p-3">
                                <p className="mb-3 text-sm font-medium">
                                    Questions
                                </p>
                                <div className="grid grid-cols-4 gap-2 lg:grid-cols-3">
                                    {tryOut.questions.map((question) => (
                                        <Button
                                            key={question.id}
                                            type="button"
                                            variant={
                                                activeQuestionId === question.id
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            className="size-10 rounded-sm font-semibold"
                                            onClick={() =>
                                                scrollToQuestion(question)
                                            }
                                        >
                                            {question.number}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </aside>

                        <div
                            ref={questionListRef}
                            className="mx-auto w-full max-w-3xl space-y-12 py-4"
                        >
                            {tryOut.questions.map((question) => (
                                <section
                                    id={`question-${question.id}`}
                                    key={question.id}
                                    data-question-id={question.id}
                                    className="grid scroll-mt-6 gap-6 md:grid-cols-[minmax(0,1fr)_3rem]"
                                >
                                    <div className="min-w-0 space-y-6">
                                        <p className="font-semibold text-foreground/90">
                                            Kategori:{' '}
                                            {question.subjectName ?? 'General'}
                                        </p>
                                        {question.subCategoryName && (
                                            <p className="-mt-4 text-sm font-medium text-muted-foreground">
                                                Sub kategori:{' '}
                                                {question.subCategoryName}
                                            </p>
                                        )}

                                        <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
                                            <span className="pt-0.5 text-lg leading-8 font-semibold text-foreground/90">
                                                {question.number}.
                                            </span>
                                            <RichContent
                                                className="block text-lg leading-8 whitespace-pre-wrap text-foreground/90"
                                                html={
                                                    question.questionHtml ||
                                                    question.questionText
                                                }
                                                typeset={false}
                                            />
                                        </div>

                                        {question.questionType ===
                                            'numeric_answer' && (
                                            <div className="text-sm">
                                                <p className="text-muted-foreground">
                                                    Answer
                                                </p>
                                                <p className="mt-1 text-lg leading-8 font-semibold text-emerald-600">
                                                    {question.answer ?? '-'}
                                                </p>
                                            </div>
                                        )}

                                        {question.questionType !==
                                            'numeric_answer' && (
                                            <div className="space-y-4">
                                                {Object.entries(
                                                    question.options,
                                                ).map(([key, value]) => {
                                                    const answerKey =
                                                        question.correctAnswers?.includes(
                                                            key,
                                                        ) ??
                                                        question.answer === key;

                                                    return (
                                                        <div
                                                            key={key}
                                                            className="grid grid-cols-[3rem_minmax(0,1fr)] items-start gap-4"
                                                        >
                                                            <span
                                                                className={cn(
                                                                    'flex size-12 items-center justify-center rounded-lg border-2 text-sm font-semibold',
                                                                    answerKey
                                                                        ? 'border-emerald-400 text-emerald-600'
                                                                        : 'border-border text-foreground/80',
                                                                )}
                                                            >
                                                                {key}
                                                            </span>
                                                            <RichContent
                                                                className="block pt-3 text-base leading-7 text-foreground/85"
                                                                html={
                                                                    question
                                                                        .optionsHtml[
                                                                        key
                                                                    ] ?? value
                                                                }
                                                                typeset={false}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="order-first flex size-12 items-center justify-center rounded-lg border-2 text-sm font-semibold md:order-none"
                                        onClick={() =>
                                            startEditingQuestion(question)
                                        }
                                    >
                                        <Pencil className="size-4" />
                                        <span className="sr-only">
                                            Edit question {question.number}
                                        </span>
                                    </Button>
                                </section>
                            ))}
                        </div>
                    </div>
                )}

                <Dialog
                    open={editDialogOpen}
                    onOpenChange={(nextOpen) => {
                        if (!nextOpen) {
                            closeEditingQuestion();
                        }
                    }}
                >
                    <DialogContent className="scrollbar-stable max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>
                                Edit question {editingQuestion?.number}
                            </DialogTitle>
                            <DialogDescription>
                                Update the question, subject, options, and
                                answer.
                            </DialogDescription>
                        </DialogHeader>
                        {editingQuestion && (
                            <Form
                                key={editingQuestion.id}
                                action={`/academics/try-outs/${tryOut.slug}/questions/${editingQuestion.id}`}
                                method="put"
                                onSuccess={() => {
                                    closeEditingQuestion();
                                }}
                                onError={() => {
                                    toast.error(
                                        'Please check the question form.',
                                    );
                                }}
                                className="space-y-4"
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <input
                                            type="hidden"
                                            name="question_type"
                                            value={editingQuestion.questionType}
                                        />
                                        {(hasMathContent(
                                            editingQuestion.questionHtml,
                                        ) ||
                                            Object.values(
                                                editingQuestion.optionsHtml,
                                            ).some(hasMathContent)) && (
                                            <Alert>
                                                <Info className="size-4" />
                                                <AlertTitle>
                                                    LaTeX + MathJax editing
                                                </AlertTitle>
                                                <AlertDescription>
                                                    Type equations with LaTeX
                                                    delimiters, for example{' '}
                                                    <code>\(x^2\)</code> or{' '}
                                                    <code>
                                                        \[\frac{'{'}1{'}'}
                                                        {'{'}2{'}'}\]
                                                    </code>
                                                    . The preview below renders
                                                    with MathJax.
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                        <div className="grid gap-2">
                                            <div className="flex items-center justify-between gap-3">
                                                <Label htmlFor="question_text">
                                                    Question
                                                </Label>
                                                <ImageUploadButton
                                                    tryOutSlug={tryOut.slug}
                                                    onUploaded={(html) =>
                                                        setQuestionSource(
                                                            (current) =>
                                                                `${current}\n${html}`.trim(),
                                                        )
                                                    }
                                                />
                                            </div>
                                            <Textarea
                                                id="question_text"
                                                name="question_text"
                                                value={questionSource}
                                                onChange={(event) =>
                                                    setQuestionSource(
                                                        event.target.value,
                                                    )
                                                }
                                                rows={5}
                                            />
                                            <InputError
                                                message={errors.question_text}
                                            />
                                            <input
                                                type="hidden"
                                                name="question_html"
                                                value={mathJaxPreviewHtml(
                                                    questionSource,
                                                )}
                                            />
                                            <div className="rounded-md border bg-muted/40 p-3 text-sm leading-6">
                                                <p className="mb-2 text-xs font-medium text-muted-foreground">
                                                    Preview
                                                </p>
                                                <RichContent
                                                    key={`question-preview-${editingQuestion.id}-${questionSource}`}
                                                    html={mathJaxPreviewHtml(
                                                        questionSource,
                                                    )}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="subject_name">
                                                Subject
                                            </Label>
                                            <Input
                                                id="subject_name"
                                                name="subject_name"
                                                defaultValue={
                                                    editingQuestion.subjectName ??
                                                    ''
                                                }
                                            />
                                            <InputError
                                                message={errors.subject_name}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="sub_category_name">
                                                Sub Category
                                            </Label>
                                            <Input
                                                id="sub_category_name"
                                                name="sub_category_name"
                                                defaultValue={
                                                    editingQuestion.subCategoryName ??
                                                    ''
                                                }
                                            />
                                            <InputError
                                                message={
                                                    errors.sub_category_name
                                                }
                                            />
                                        </div>
                                        {editingQuestion.questionType !==
                                            'numeric_answer' && (
                                            <div className="grid gap-3">
                                                {['A', 'B', 'C', 'D', 'E'].map(
                                                    (optionKey) => (
                                                        <div
                                                            key={optionKey}
                                                            className="grid gap-2"
                                                        >
                                                            <div className="flex items-center justify-between gap-3">
                                                                <Label
                                                                    htmlFor={`option-${optionKey}`}
                                                                >
                                                                    Option{' '}
                                                                    {optionKey}
                                                                </Label>
                                                                <ImageUploadButton
                                                                    tryOutSlug={
                                                                        tryOut.slug
                                                                    }
                                                                    onUploaded={(
                                                                        html,
                                                                    ) =>
                                                                        setOptionSources(
                                                                            (
                                                                                current,
                                                                            ) => ({
                                                                                ...current,
                                                                                [optionKey]:
                                                                                    `${current[optionKey] ?? ''}\n${html}`.trim(),
                                                                            }),
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                            <Textarea
                                                                id={`option-${optionKey}`}
                                                                name={`options[${optionKey}]`}
                                                                value={
                                                                    optionSources[
                                                                        optionKey
                                                                    ] ?? ''
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setOptionSources(
                                                                        (
                                                                            current,
                                                                        ) => ({
                                                                            ...current,
                                                                            [optionKey]:
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                        }),
                                                                    )
                                                                }
                                                                rows={2}
                                                            />
                                                            <InputError
                                                                message={
                                                                    errors[
                                                                        `options.${optionKey}`
                                                                    ]
                                                                }
                                                            />
                                                            <input
                                                                type="hidden"
                                                                name={`options_html[${optionKey}]`}
                                                                value={mathJaxPreviewHtml(
                                                                    optionSources[
                                                                        optionKey
                                                                    ] ?? '',
                                                                )}
                                                            />
                                                            <div className="rounded-md border bg-muted/40 p-3 text-sm leading-6">
                                                                <p className="mb-2 text-xs font-medium text-muted-foreground">
                                                                    Preview
                                                                </p>
                                                                <RichContent
                                                                    key={`option-preview-${editingQuestion.id}-${optionKey}-${optionSources[optionKey] ?? ''}`}
                                                                    html={mathJaxPreviewHtml(
                                                                        optionSources[
                                                                            optionKey
                                                                        ] ?? '',
                                                                    )}
                                                                />
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                        {editingQuestion.questionType ===
                                        'multiple_answer' ? (
                                            <div className="grid gap-3">
                                                <Label>Correct answers</Label>
                                                <div className="flex flex-wrap gap-4">
                                                    {[
                                                        'A',
                                                        'B',
                                                        'C',
                                                        'D',
                                                        'E',
                                                    ].map((optionKey) => (
                                                        <Label
                                                            key={optionKey}
                                                            className="flex items-center gap-2 font-normal"
                                                        >
                                                            <Checkbox
                                                                name="correct_answers[]"
                                                                value={
                                                                    optionKey
                                                                }
                                                                defaultChecked={editingQuestion.correctAnswers.includes(
                                                                    optionKey,
                                                                )}
                                                            />
                                                            {optionKey}
                                                        </Label>
                                                    ))}
                                                </div>
                                                <InputError
                                                    message={
                                                        errors.correct_answers
                                                    }
                                                />
                                            </div>
                                        ) : editingQuestion.questionType ===
                                          'single_choice' ? (
                                            <div className="grid gap-2">
                                                <Label htmlFor="answer">
                                                    Answer
                                                </Label>
                                                <Select
                                                    name="answer"
                                                    defaultValue={
                                                        editingQuestion.answer ??
                                                        'none'
                                                    }
                                                >
                                                    <SelectTrigger id="answer">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">
                                                            No answer
                                                        </SelectItem>
                                                        {[
                                                            'A',
                                                            'B',
                                                            'C',
                                                            'D',
                                                            'E',
                                                        ].map((optionKey) => (
                                                            <SelectItem
                                                                key={optionKey}
                                                                value={
                                                                    optionKey
                                                                }
                                                            >
                                                                {optionKey}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <InputError
                                                    message={errors.answer}
                                                />
                                            </div>
                                        ) : (
                                            <div className="grid gap-2">
                                                <Label htmlFor="answer">
                                                    Numeric answer
                                                </Label>
                                                <Input
                                                    id="answer"
                                                    name="answer"
                                                    inputMode="decimal"
                                                    defaultValue={
                                                        editingQuestion.answer ??
                                                        ''
                                                    }
                                                />
                                                <InputError
                                                    message={errors.answer}
                                                />
                                            </div>
                                        )}
                                        {tryOut.scoringMode === 'raw_score' && (
                                            <div className="grid gap-2">
                                                <Label htmlFor="points">
                                                    Score
                                                </Label>
                                                <Input
                                                    id="points"
                                                    name="points"
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.0001"
                                                    defaultValue={
                                                        editingQuestion.points ??
                                                        ''
                                                    }
                                                />
                                                <InputError
                                                    message={errors.points}
                                                />
                                            </div>
                                        )}
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full"
                                        >
                                            {processing
                                                ? 'Saving...'
                                                : 'Save question'}
                                        </Button>
                                    </>
                                )}
                            </Form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

AdminTryOutQuestions.layout = {
    breadcrumbs: [
        {
            title: 'Academics',
            href: '/academics/fields',
        },
        {
            title: 'Try Out',
            href: '/academics/try-outs',
        },
        {
            title: 'Questions',
            href: '#',
        },
    ],
};
