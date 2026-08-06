import { sleep } from 'k6';
import exec from 'k6/execution';
import { credentialAt, login, openTryOut } from './common.js';
import {
    latencyThresholds,
    selectedProfile,
    shouldEnforceLatencyThresholds,
    thresholds,
} from './profiles.js';

const profile = selectedProfile();
let sessionOpened = false;

export const options = {
    scenarios: {
        open_session: {
            executor: 'ramping-vus',
            gracefulRampDown: '15s',
            stages: profile.openStages,
        },
    },
    thresholds: {
        checks: thresholds.checks,
        'http_req_failed{endpoint:open_session}': thresholds['http_req_failed{endpoint:open_session}'],
        ...(shouldEnforceLatencyThresholds() ? {
            'http_req_duration{endpoint:open_session}': latencyThresholds['http_req_duration{endpoint:open_session}'],
        } : {}),
    },
};

export default function () {
    if (!sessionOpened) {
        sessionOpened = true;
        const credential = credentialAt(exec.vu.idInTest - 1);

        login(credential);
        openTryOut();
    }

    sleep(1);
}
