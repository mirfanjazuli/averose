const profiles = {
    smoke: {
        openStages: [
            { duration: '5s', target: 10 },
            { duration: '20s', target: 10 },
            { duration: '5s', target: 0 },
        ],
        userCount: 10,
        loginRampSeconds: 2,
        submitWindowSeconds: 5,
    },
    local: {
        openStages: [
            { duration: '20s', target: 50 },
            { duration: '30s', target: 100 },
            { duration: '1m', target: 300 },
            { duration: '30s', target: 300 },
            { duration: '20s', target: 0 },
        ],
        userCount: 300,
        loginRampSeconds: 60,
        submitWindowSeconds: 30,
    },
    target: {
        openStages: [
            { duration: '2m', target: 100 },
            { duration: '3m', target: 300 },
            { duration: '5m', target: 1000 },
            { duration: '5m', target: 2000 },
            { duration: '5m', target: 3000 },
            { duration: '5m', target: 3000 },
            { duration: '2m', target: 0 },
        ],
        userCount: 3000,
        loginRampSeconds: 600,
        submitWindowSeconds: 60,
    },
};

export function selectedProfile() {
    const name = __ENV.PROFILE || 'smoke';
    const profile = profiles[name];

    if (!profile) {
        throw new Error(`Unknown PROFILE "${name}". Use smoke, local, or target.`);
    }

    return profile;
}

export const thresholds = {
    checks: ['rate>0.99'],
    'http_req_failed{endpoint:open_session}': ['rate<0.01'],
    'http_req_failed{endpoint:submit}': ['rate<0.01'],
    'http_req_failed{endpoint:result}': ['rate<0.01'],
};

export const latencyThresholds = {
    'http_req_duration{endpoint:open_session}': ['p(95)<2000', 'p(99)<5000'],
    'http_req_duration{endpoint:submit}': ['p(95)<3000', 'p(99)<8000'],
    'http_req_duration{endpoint:result}': ['p(95)<3000'],
};

export function shouldEnforceLatencyThresholds() {
    if (__ENV.ENFORCE_SLO === 'true') {
        return true;
    }

    if (__ENV.ENFORCE_SLO === 'false') {
        return false;
    }

    return (__ENV.PROFILE || 'smoke') !== 'smoke';
}
