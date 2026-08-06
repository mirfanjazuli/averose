import { check, fail } from 'k6';
import http from 'k6/http';
import { SharedArray } from 'k6/data';

const DEFAULT_USERS_FILE = '../../../storage/app/private/load-tests/try-out-users.csv';

export const baseUrl = (__ENV.BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
export const tryOutSlug = __ENV.TRY_OUT_SLUG || 'load-test-try-out-3000';

export const credentials = new SharedArray('try-out-load-test-users', () => {
    const source = open(__ENV.USERS_FILE || DEFAULT_USERS_FILE).trim();

    return source
        .split(/\r?\n/)
        .slice(1)
        .filter(Boolean)
        .map((line) => {
            const [index, email, ...passwordParts] = line.split(',');

            return {
                index: Number(index),
                email,
                password: passwordParts.join(','),
            };
        });
});

export function credentialAt(index) {
    const credential = credentials[index];

    if (!credential) {
        fail(`No credential exists at index ${index}. Prepare more load-test users first.`);
    }

    return credential;
}

export function login(credential) {
    const loginPage = http.get(`${baseUrl}/login`, {
        tags: { endpoint: 'auth_setup' },
    });
    const csrfToken = csrfTokenFrom(loginPage);

    const response = http.post(
        `${baseUrl}/login`,
        {
            _token: csrfToken,
            email: credential.email,
            password: credential.password,
        },
        {
            redirects: 0,
            tags: { endpoint: 'auth_setup' },
        },
    );

    const succeeded = check(response, {
        'login redirects successfully': (result) => [302, 303].includes(result.status),
    });

    if (!succeeded) {
        fail(`Login failed for ${credential.email} with status ${response.status}.`);
    }

    return csrfToken;
}

export function openTryOut() {
    const listResponse = http.get(`${baseUrl}/try-outs`, {
        tags: { endpoint: 'try_out_list' },
    });
    const listSucceeded = check(listResponse, {
        'try out list loads': (response) => response.status === 200,
    });

    if (!listSucceeded) {
        fail(`Try out list failed with status ${listResponse.status}.`);
    }

    const response = http.get(`${baseUrl}/try-outs/${tryOutSlug}`, {
        tags: { endpoint: 'open_session' },
    });
    const page = inertiaPageFrom(response);
    const tryOut = page?.props?.tryOut;
    const succeeded = check(response, {
        'try out session loads': (result) => result.status === 200,
        'try out contains questions': () => Array.isArray(tryOut?.questions) && tryOut.questions.length > 0,
    });

    if (!succeeded) {
        fail(`Try out session failed with status ${response.status}.`);
    }

    return {
        answers: answersFor(tryOut.questions),
        csrfToken: csrfTokenFrom(response),
        tryOut,
    };
}

export function submissionRequest(session, responseCallback = http.expectedStatuses(302, 303)) {
    return {
        method: 'POST',
        url: `${baseUrl}/try-outs/${tryOutSlug}/submit`,
        body: JSON.stringify({ answers: session.answers }),
        params: {
            headers: {
                Accept: 'text/html, application/xhtml+xml',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': session.csrfToken,
                'X-Inertia': 'true',
                'X-Requested-With': 'XMLHttpRequest',
            },
            redirects: 0,
            responseCallback,
            tags: { endpoint: 'submit' },
        },
    };
}

export function submitTryOut(session) {
    const request = submissionRequest(session);
    const response = http.request(request.method, request.url, request.body, request.params);
    const succeeded = check(response, {
        'try out submit redirects': (result) => [302, 303].includes(result.status),
        'try out submit has result location': (result) => Boolean(result.headers.Location),
    });

    if (!succeeded) {
        fail(`Try out submit failed with status ${response.status}.`);
    }

    const resultUrl = absoluteUrl(response.headers.Location);
    const result = http.get(resultUrl, {
        tags: { endpoint: 'result' },
    });

    check(result, {
        'try out result loads': (response) => response.status === 200,
    });

    return { response, result };
}

export function absoluteUrl(location) {
    if (location.startsWith('http://') || location.startsWith('https://')) {
        return location;
    }

    return `${baseUrl}${location.startsWith('/') ? '' : '/'}${location}`;
}

function csrfTokenFrom(response) {
    const token = response.html().find('meta[name="csrf-token"]').attr('content');

    if (!token) {
        fail(`CSRF token was not found in ${response.url}.`);
    }

    return token;
}

function inertiaPageFrom(response) {
    const document = response.html();
    const page = document.find('script[data-page="app"]').text()
        || document.find('#app').attr('data-page');

    if (!page) {
        return null;
    }

    try {
        return JSON.parse(page);
    } catch (error) {
        fail(`Unable to parse Inertia page data: ${error.message}`);
    }
}

function answersFor(questions) {
    return Object.fromEntries(
        questions.map((question) => {
            switch (question.questionType) {
                case 'multiple_answer':
                    return [question.id, ['A', 'C']];
                case 'numeric_answer':
                    return [question.id, '42'];
                default:
                    return [question.id, 'A'];
            }
        }),
    );
}
