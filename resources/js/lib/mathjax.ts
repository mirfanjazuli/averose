type MathJaxConfig = {
    startup?: {
        promise?: Promise<void>;
        typeset?: boolean;
    };
    tex?: {
        inlineMath?: string[][] | { '[+]': string[][] };
        displayMath?: string[][] | { '[+]': string[][] };
        processEscapes?: boolean;
    };
    typesetClear?: (elements?: HTMLElement[]) => void;
    typesetPromise?: (elements?: HTMLElement[]) => Promise<void>;
};

declare global {
    interface Window {
        MathJax?: MathJaxConfig;
    }
}

let mathJaxLoader: Promise<void> | null = null;
let mathJaxQueue = Promise.resolve();
let mathJaxDocumentScheduled = false;
const mathJaxScriptId = 'MathJax-script';
const mathJaxScriptSrc =
    'https://cdn.jsdelivr.net/npm/mathjax@4.1.2/tex-mml-chtml.js';

async function withTimeout<T>(
    promise: Promise<T>,
    message: string,
    milliseconds = 5000,
): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(message));
        }, milliseconds);
    });

    try {
        return await Promise.race([promise, timeout]);
    } finally {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }
}

async function loadMathJax() {
    if (!mathJaxLoader) {
        const resolveWhenReady = (resolve: () => void, reject: () => void) => {
            const startupPromise = window.MathJax?.startup?.promise;

            if (startupPromise) {
                void startupPromise.then(resolve, reject);

                return;
            }

            resolve();
        };

        window.MathJax = {
            ...window.MathJax,
            tex: {
                ...window.MathJax?.tex,
                displayMath: {
                    '[+]': [['$$', '$$']],
                },
                inlineMath: {
                    '[+]': [['$', '$']],
                },
                processEscapes: true,
            },
            startup: {
                ...window.MathJax?.startup,
                typeset: false,
            },
        };

        mathJaxLoader = new Promise<void>((resolve, reject) => {
            const existingScript =
                document.getElementById(mathJaxScriptId) ??
                document.querySelector<HTMLScriptElement>(
                    `script[src="${mathJaxScriptSrc}"]`,
                );

            if (existingScript) {
                if (window.MathJax?.typesetPromise) {
                    resolveWhenReady(resolve, reject);

                    return;
                }

                existingScript.addEventListener(
                    'load',
                    () => resolveWhenReady(resolve, reject),
                    { once: true },
                );
                existingScript.addEventListener(
                    'error',
                    () => reject(new Error('Failed to load MathJax.')),
                    { once: true },
                );

                return;
            }

            const script = document.createElement('script');
            script.async = true;
            script.id = mathJaxScriptId;
            script.src = mathJaxScriptSrc;
            script.onload = () => {
                resolveWhenReady(resolve, reject);
            };
            script.onerror = () => reject(new Error('Failed to load MathJax.'));

            document.head.appendChild(script);
        });
    }

    return mathJaxLoader;
}

export async function typesetMath(element: HTMLElement): Promise<boolean> {
    if (!hasMathSource(element.innerHTML)) {
        return false;
    }

    mathJaxQueue = mathJaxQueue
        .catch(() => undefined)
        .then(async () => {
            await loadMathJax();

            if (!element.isConnected) {
                return;
            }

            window.MathJax?.typesetClear?.([element]);
            await withTimeout(
                window.MathJax?.typesetPromise?.([element]) ??
                    Promise.resolve(),
                'MathJax typesetting timed out.',
            );
        });

    await mathJaxQueue;

    return true;
}

export async function prepareMathJax(htmlSources: string[]): Promise<boolean> {
    if (!htmlSources.some((html) => hasMathSource(html))) {
        return false;
    }

    await loadMathJax();

    return true;
}

export function scheduleTypesetMath(element: HTMLElement): void {
    if (!hasMathSource(element.innerHTML)) {
        return;
    }

    void typesetMath(element).catch((error: unknown) => {
        console.error('MathJax failed to render dynamic content.', error);
    });
}

export function scheduleDocumentTypeset(): void {
    if (mathJaxDocumentScheduled) {
        return;
    }

    mathJaxDocumentScheduled = true;

    requestAnimationFrame(() => {
        mathJaxDocumentScheduled = false;
        void typesetMath(document.body).catch((error: unknown) => {
            console.error('MathJax failed to render the page.', error);
        });
    });
}

export function clearTypesetMath(element: HTMLElement) {
    window.MathJax?.typesetClear?.([element]);
}

export function hasMathSource(html: string) {
    return (
        html.includes('<math') ||
        html.includes('\\(') ||
        html.includes('\\[') ||
        html.includes('$$') ||
        /\$(?!\s)[^$]+(?<!\s)\$/u.test(html)
    );
}
