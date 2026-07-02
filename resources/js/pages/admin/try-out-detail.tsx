import { Form, Head, usePage } from '@inertiajs/react';
import {
    BookOpenCheck,
    Clock3,
    FileUp,
    Info,
    ListChecks,
    LoaderCircle,
    Pencil,
    Upload,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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

type TryOutQuestion = {
    answer: string | null;
    id: string;
    number: number;
    options: Record<string, string>;
    optionsHtml: Record<string, string>;
    questionHtml: string;
    questionText: string;
    subjectName: string | null;
};

type TryOutDetail = {
    duration: string;
    id: string;
    questions: TryOutQuestion[];
    questionsCount: number;
    slug: string;
    status: string;
    subjects: string[];
    title: string;
};

type PreviewQuestion = {
    answer: string | null;
    number: number;
    options: Record<string, string>;
    options_html: Record<string, string>;
    question_html: string;
    question_text: string;
    subject_name: string | null;
};

type ReimportPreview = {
    questionCount: number;
    questions: PreviewQuestion[];
    subjects: string[];
    title: string;
    token: string;
};

const previewQuestionFragmentCount = (questions: PreviewQuestion[]) =>
    questions.reduce(
        (count, question) => count + 1 + Object.keys(question.options).length,
        0,
    );

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

        if (!containsMath || !typeset) {
            queueMicrotask(() => {
                if (isCurrent && readyKey) {
                    onReady?.(readyKey);
                }
            });

            return () => {
                isCurrent = false;
            };
        }

        void typesetMath(element)
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
            className={className}
            dangerouslySetInnerHTML={{ __html: html }}
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

    return root.textContent?.trim() || fallback;
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

export default function AdminTryOutDetail({
    tryOut,
}: {
    tryOut: TryOutDetail;
}) {
    const page = usePage<{
        flash?: {
            success?: string;
            tryOutReimportPreview?: ReimportPreview;
        };
    }>();
    const flashReimportPreview =
        page.props.flash?.tryOutReimportPreview ?? null;
    const [editingQuestion, setEditingQuestion] =
        useState<TryOutQuestion | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [reimportOpen, setReimportOpen] = useState(
        Boolean(flashReimportPreview),
    );
    const [dismissedReimportToken, setDismissedReimportToken] = useState<
        string | null
    >(null);
    const [readyReimportFragments, setReadyReimportFragments] = useState<
        Set<string>
    >(new Set());
    const [isPreparingReimportPreview, setIsPreparingReimportPreview] =
        useState(false);
    const [questionSource, setQuestionSource] = useState('');
    const [optionSources, setOptionSources] = useState<Record<string, string>>(
        {},
    );
    const closeEditTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );
    const questionListRef = useRef<HTMLDivElement>(null);
    const reimportPreview =
        flashReimportPreview?.token !== dismissedReimportToken
            ? flashReimportPreview
            : null;
    const readyReimportFragmentCount = reimportPreview
        ? Array.from(readyReimportFragments).filter((fragmentKey) =>
              fragmentKey.startsWith(`${reimportPreview.token}:`),
          ).length
        : 0;
    const isReimportPreviewReady = Boolean(
        reimportPreview &&
        readyReimportFragmentCount >=
            previewQuestionFragmentCount(reimportPreview.questions),
    );

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
        return () => {
            if (closeEditTimeoutRef.current) {
                clearTimeout(closeEditTimeoutRef.current);
            }
        };
    }, []);

    const markReimportFragmentReady = useCallback((fragmentKey: string) => {
        setReadyReimportFragments((current) => {
            if (current.has(fragmentKey)) {
                return current;
            }

            const next = new Set(current);
            next.add(fragmentKey);

            return next;
        });
    }, []);

    const closeEditingQuestion = useCallback(() => {
        setEditDialogOpen(false);

        if (closeEditTimeoutRef.current) {
            clearTimeout(closeEditTimeoutRef.current);
        }

        closeEditTimeoutRef.current = setTimeout(() => {
            setEditingQuestion(null);
            closeEditTimeoutRef.current = null;
        }, 150);
    }, []);

    const startEditingQuestion = (question: TryOutQuestion) => {
        if (closeEditTimeoutRef.current) {
            clearTimeout(closeEditTimeoutRef.current);
            closeEditTimeoutRef.current = null;
        }

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

    return (
        <>
            <Head title={tryOut.title} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            {tryOut.title}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Try out detail, subjects, questions, and answers.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge
                            variant="outline"
                            className={
                                tryOut.status === 'Published'
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : undefined
                            }
                        >
                            {tryOut.status}
                        </Badge>
                        <Dialog
                            open={reimportOpen}
                            onOpenChange={(nextOpen) => {
                                setReimportOpen(nextOpen);

                                if (!nextOpen && reimportPreview) {
                                    setIsPreparingReimportPreview(false);
                                    setReadyReimportFragments(new Set());
                                    setDismissedReimportToken(
                                        reimportPreview.token,
                                    );
                                }
                            }}
                        >
                            <DialogTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <FileUp className="size-4" />
                                    Reimport DOCX
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
                                <DialogHeader>
                                    <DialogTitle>
                                        {reimportPreview &&
                                        isReimportPreviewReady
                                            ? 'Review generated questions'
                                            : 'Reimport try out questions'}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {reimportPreview &&
                                        isReimportPreviewReady
                                            ? 'Review the parsed questions before replacing the current question set.'
                                            : 'Upload a Word document containing numbered questions, choices A-E, and an answer key section.'}
                                    </DialogDescription>
                                </DialogHeader>
                                {reimportPreview && (
                                    <div
                                        className={
                                            isReimportPreviewReady
                                                ? 'space-y-4'
                                                : 'pointer-events-none fixed top-0 -left-[9999px] w-[840px] opacity-0'
                                        }
                                        aria-hidden={!isReimportPreviewReady}
                                    >
                                        <Alert>
                                            <Info className="size-4" />
                                            <AlertTitle>
                                                This will replace questions
                                            </AlertTitle>
                                            <AlertDescription>
                                                Saving this preview will remove
                                                the current questions and use
                                                the generated questions below.
                                            </AlertDescription>
                                        </Alert>

                                        <div className="grid gap-3 rounded-lg border p-4 text-sm md:grid-cols-4">
                                            <div>
                                                <p className="text-muted-foreground">
                                                    Title
                                                </p>
                                                <p className="font-medium">
                                                    {reimportPreview.title}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">
                                                    Status
                                                </p>
                                                <p className="font-medium">
                                                    {tryOut.status}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">
                                                    Duration
                                                </p>
                                                <p className="font-medium">
                                                    {tryOut.duration}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">
                                                    Questions
                                                </p>
                                                <p className="font-medium">
                                                    {
                                                        reimportPreview.questionCount
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-2">
                                            {reimportPreview.questions.map(
                                                (question) => (
                                                    <div
                                                        key={question.number}
                                                        className="space-y-3 rounded-lg border p-4"
                                                    >
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <div>
                                                                <h3 className="font-semibold">
                                                                    Question{' '}
                                                                    {
                                                                        question.number
                                                                    }
                                                                </h3>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {question.subject_name ??
                                                                        'General'}
                                                                </p>
                                                            </div>
                                                            <Badge variant="secondary">
                                                                Answer:{' '}
                                                                {question.answer ??
                                                                    '-'}
                                                            </Badge>
                                                        </div>

                                                        <RichContent
                                                            className="text-sm leading-6"
                                                            html={
                                                                question.question_html ||
                                                                question.question_text
                                                            }
                                                            readyKey={`${reimportPreview.token}:question-${question.number}`}
                                                            onReady={
                                                                markReimportFragmentReady
                                                            }
                                                        />

                                                        <div className="grid gap-2">
                                                            {Object.entries(
                                                                question.options,
                                                            ).map(
                                                                ([
                                                                    key,
                                                                    value,
                                                                ]) => (
                                                                    <div
                                                                        key={
                                                                            key
                                                                        }
                                                                        className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2 rounded-lg border p-3 text-sm"
                                                                    >
                                                                        <span className="flex size-8 items-center justify-center rounded-full border font-semibold">
                                                                            {
                                                                                key
                                                                            }
                                                                        </span>
                                                                        <RichContent
                                                                            className="pt-1 leading-6"
                                                                            html={
                                                                                question
                                                                                    .options_html[
                                                                                    key
                                                                                ] ??
                                                                                value
                                                                            }
                                                                            readyKey={`${reimportPreview.token}:question-${question.number}-option-${key}`}
                                                                            onReady={
                                                                                markReimportFragmentReady
                                                                            }
                                                                        />
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>

                                        <div className="flex flex-wrap justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setIsPreparingReimportPreview(
                                                        false,
                                                    );
                                                    setReadyReimportFragments(
                                                        new Set(),
                                                    );
                                                    setDismissedReimportToken(
                                                        reimportPreview.token,
                                                    );
                                                }}
                                            >
                                                Upload another
                                            </Button>
                                            <Form
                                                action={`/academics/try-outs/${tryOut.slug}/reimport`}
                                                method="post"
                                                onSuccess={() => {
                                                    setDismissedReimportToken(
                                                        reimportPreview.token,
                                                    );
                                                    setReimportOpen(false);
                                                }}
                                                onError={() => {
                                                    toast.error(
                                                        'Failed to reimport questions.',
                                                    );
                                                }}
                                            >
                                                {({ errors, processing }) => (
                                                    <>
                                                        <input
                                                            type="hidden"
                                                            name="token"
                                                            value={
                                                                reimportPreview.token
                                                            }
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.token
                                                            }
                                                            className="mb-2"
                                                        />
                                                        <Button
                                                            type="submit"
                                                            disabled={
                                                                processing
                                                            }
                                                            className="gap-2"
                                                        >
                                                            <Upload className="size-4" />
                                                            {processing
                                                                ? 'Replacing...'
                                                                : 'Replace questions'}
                                                        </Button>
                                                    </>
                                                )}
                                            </Form>
                                        </div>
                                    </div>
                                )}

                                {(!reimportPreview ||
                                    !isReimportPreviewReady) && (
                                    <Form
                                        action={`/academics/try-outs/${tryOut.slug}/reimport/preview`}
                                        method="post"
                                        encType="multipart/form-data"
                                        resetOnSuccess
                                        onStart={() => {
                                            setIsPreparingReimportPreview(true);
                                            setReadyReimportFragments(
                                                new Set(),
                                            );
                                        }}
                                        onSuccess={() => {
                                            setReimportOpen(true);
                                        }}
                                        onError={() => {
                                            setIsPreparingReimportPreview(
                                                false,
                                            );
                                            toast.error(
                                                'Failed to generate preview.',
                                            );
                                        }}
                                        className="space-y-4"
                                    >
                                        {({ errors, processing }) => (
                                            <>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="reimport-document">
                                                        Word document
                                                    </Label>
                                                    <Input
                                                        id="reimport-document"
                                                        name="document"
                                                        type="file"
                                                        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.document
                                                        }
                                                    />
                                                </div>

                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        processing ||
                                                        isPreparingReimportPreview
                                                    }
                                                    className="w-full gap-2"
                                                >
                                                    {processing ||
                                                    isPreparingReimportPreview ? (
                                                        <LoaderCircle className="size-4 animate-spin" />
                                                    ) : (
                                                        <Upload className="size-4" />
                                                    )}
                                                    {processing
                                                        ? 'Generating...'
                                                        : isPreparingReimportPreview
                                                          ? 'Preparing preview...'
                                                          : 'Generate preview'}
                                                </Button>
                                            </>
                                        )}
                                    </Form>
                                )}
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Clock3 className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Duration
                                </p>
                                <p className="text-2xl font-semibold">
                                    {tryOut.duration}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <ListChecks className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Questions
                                </p>
                                <p className="text-2xl font-semibold">
                                    {tryOut.questionsCount}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <BookOpenCheck className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Subjects
                                </p>
                                <p className="text-2xl font-semibold">
                                    {tryOut.subjects.length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Dialog
                    open={editDialogOpen}
                    onOpenChange={(nextOpen) => {
                        if (!nextOpen) {
                            closeEditingQuestion();
                        }
                    }}
                >
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
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
                                            <Label htmlFor="question_text">
                                                Question
                                            </Label>
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
                                        <div className="grid gap-3">
                                            {['A', 'B', 'C', 'D', 'E'].map(
                                                (optionKey) => (
                                                    <div
                                                        key={optionKey}
                                                        className="grid gap-2"
                                                    >
                                                        <Label
                                                            htmlFor={`option-${optionKey}`}
                                                        >
                                                            Option {optionKey}
                                                        </Label>
                                                        <Textarea
                                                            id={`option-${optionKey}`}
                                                            name={`options[${optionKey}]`}
                                                            value={
                                                                optionSources[
                                                                    optionKey
                                                                ] ?? ''
                                                            }
                                                            onChange={(event) =>
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
                                                            value={optionKey}
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

                <Card>
                    <CardHeader>
                        <CardTitle>Question list</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {tryOut.questions.length === 0 ? (
                            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No questions available.
                            </div>
                        ) : (
                            <div ref={questionListRef} className="space-y-4">
                                {tryOut.questions.map((question) => (
                                    <div
                                        key={question.id}
                                        className="rounded-2xl border p-4"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="font-semibold">
                                                        Question{' '}
                                                        {question.number}
                                                    </h3>
                                                    <Badge variant="outline">
                                                        {question.subjectName ??
                                                            'General'}
                                                    </Badge>
                                                    <Badge variant="secondary">
                                                        Answer:{' '}
                                                        {question.answer ?? '-'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="gap-2"
                                                onClick={() =>
                                                    startEditingQuestion(
                                                        question,
                                                    )
                                                }
                                            >
                                                <Pencil className="size-4" />
                                                Edit
                                            </Button>
                                        </div>
                                        <div className="mt-4 space-y-4">
                                            <RichContent
                                                className="text-sm leading-6"
                                                html={
                                                    question.questionHtml ||
                                                    question.questionText
                                                }
                                                typeset={false}
                                            />
                                            <div className="grid gap-2">
                                                {Object.entries(
                                                    question.options,
                                                ).map(([key, value]) => (
                                                    <div
                                                        key={key}
                                                        className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2 rounded-xl border p-3 text-sm"
                                                    >
                                                        <span className="flex size-8 items-center justify-center rounded-full border font-semibold">
                                                            {key}
                                                        </span>
                                                        <RichContent
                                                            className="pt-1 leading-6"
                                                            html={
                                                                question
                                                                    .optionsHtml[
                                                                    key
                                                                ] ?? value
                                                            }
                                                            typeset={false}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AdminTryOutDetail.layout = {
    breadcrumbs: [
        {
            title: 'Academics',
            href: '/academics/fields',
        },
        {
            title: 'Try Out',
            href: '/academics/try-outs',
        },
    ],
};
