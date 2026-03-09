'use client';

import { useEffect } from 'react';
import { clarity } from 'react-microsoft-clarity';

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

export function MicrosoftClarity() {
    useEffect(() => {
        if (CLARITY_ID) {
            clarity.init(CLARITY_ID);
            // Note: clarity.consent() is intentionally not called here.
            // It should only be called after the user explicitly grants consent
            // (e.g., via a cookie consent banner) to comply with GDPR/ePrivacy.
        }
    }, []);

    return null;
}
