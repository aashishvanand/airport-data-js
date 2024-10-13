'use client';

import { useEffect } from 'react';
import { clarity } from 'react-microsoft-clarity';

export function MicrosoftClarity() {
    useEffect(() => {
        clarity.init("jbrv3kn1w7");
        clarity.consent();
    }, []);

    return null;
}