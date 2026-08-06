import { check, sleep } from 'k6';
import http from 'k6/http';
import exec from 'k6/execution';
import {
    absoluteUrl,
    credentialAt,
    login,
    openTryOut,
    submissionRequest,
} from './common.js';

const userCount = Number(__ENV.USER_COUNT || 10);

export const options = {
    scenarios: {
        duplicate_submit: {
            executor: 'per-vu-iterations',
            iterations: 1,
            maxDuration: '2m',
            vus: userCount,
        },
    },
    thresholds: {
        checks: ['rate>0.99'],
    },
};

export default function () {
    const credential = credentialAt(exec.vu.idInTest - 1);
    login(credential);
    const session = openTryOut();
    const request = submissionRequest(session, http.expectedStatuses(302, 303, 404));
    const responses = http.batch([request, request]);
    const successful = responses.filter((response) => [302, 303].includes(response.status));
    const rejected = responses.filter((response) => response.status === 404);

    check(responses, {
        'only one duplicate submission succeeds': () => successful.length === 1,
        'the duplicate submission is rejected': () => rejected.length === 1,
    });

    if (successful[0]?.headers.Location) {
        const result = http.get(absoluteUrl(successful[0].headers.Location), {
            tags: { endpoint: 'result' },
        });

        check(result, {
            'duplicate test result loads': (response) => response.status === 200,
        });
    }

    sleep(1);
}
