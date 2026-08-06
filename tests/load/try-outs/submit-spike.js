import { sleep } from 'k6';
import exec from 'k6/execution';
import { credentialAt, login, openTryOut, submitTryOut } from './common.js';
import {
    latencyThresholds,
    selectedProfile,
    shouldEnforceLatencyThresholds,
    thresholds,
} from './profiles.js';

const profile = selectedProfile();
const userCount = Number(__ENV.USER_COUNT || profile.userCount);
const loginRampSeconds = Number(__ENV.LOGIN_RAMP_SECONDS || profile.loginRampSeconds);
const submitWindowSeconds = Number(__ENV.SUBMIT_WINDOW_SECONDS || profile.submitWindowSeconds);
const examHoldSeconds = Number(__ENV.EXAM_HOLD_SECONDS || 10);
const maximumDurationSeconds = loginRampSeconds + examHoldSeconds + submitWindowSeconds + 120;

export const options = {
    scenarios: {
        submit_spike: {
            executor: 'per-vu-iterations',
            gracefulStop: '30s',
            iterations: 1,
            maxDuration: `${maximumDurationSeconds}s`,
            vus: userCount,
        },
    },
    thresholds: {
        checks: thresholds.checks,
        'http_req_failed{endpoint:open_session}': thresholds['http_req_failed{endpoint:open_session}'],
        'http_req_failed{endpoint:submit}': thresholds['http_req_failed{endpoint:submit}'],
        'http_req_failed{endpoint:result}': thresholds['http_req_failed{endpoint:result}'],
        ...(shouldEnforceLatencyThresholds() ? latencyThresholds : {}),
    },
};

export default function () {
    const userIndex = exec.vu.idInTest - 1;
    const loginOffset = (userIndex / userCount) * loginRampSeconds;

    sleep(loginOffset);

    const credential = credentialAt(userIndex);
    login(credential);
    const session = openTryOut();

    const submitOffset = (userIndex / userCount) * submitWindowSeconds;
    const submitAt = Number(exec.scenario.startTime)
        + ((loginRampSeconds + examHoldSeconds + submitOffset) * 1000);
    const waitSeconds = Math.max(0, (submitAt - Date.now()) / 1000);

    sleep(waitSeconds);
    submitTryOut(session);
}
