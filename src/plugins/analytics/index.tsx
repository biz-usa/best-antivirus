
'use client';

import { getSiteConfig } from '@/lib/data';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function AnalyticsScript() {
    const pathname = usePathname();

    useEffect(() => {
        let scriptElement: HTMLScriptElement | null = null;
        let noscriptElement: HTMLElement | null = null;

        const loadScript = async () => {
            try {
                const config = await getSiteConfig();
                const analyticsConfig = config.plugins?.analytics;
                
                const isExcluded = analyticsConfig?.excludedPages?.some(page => {
                    const trimmedPage = page.trim();
                    if (!trimmedPage) return false;
                    return pathname.trim().startsWith(trimmedPage);
                }) ?? false;

                if (analyticsConfig?.enabled && analyticsConfig.script && !isExcluded) {
                    const scriptId = 'analytics-script-tag';
                    
                    if (document.getElementById(scriptId)) {
                        return;
                    }

                    const fragment = document.createRange().createContextualFragment(analyticsConfig.script);
                    const scriptNode = fragment.querySelector('script');
                    const noscriptNode = fragment.querySelector('noscript');

                    if (scriptNode) {
                        scriptElement = document.createElement('script');
                        scriptElement.id = scriptId;
                        scriptElement.innerHTML = scriptNode.innerHTML;
                        
                        for (const attr of scriptNode.attributes) {
                            scriptElement.setAttribute(attr.name, attr.value);
                        }
                        
                        document.head.appendChild(scriptElement);
                    }

                    if (noscriptNode) {
                        noscriptElement = document.createElement('noscript');
                        noscriptElement.innerHTML = noscriptNode.innerHTML;
                        document.body.prepend(noscriptElement);
                    }
                }
            } catch (error) {
                console.error("Failed to load analytics script:", error);
            }
        };

        loadScript();
        
        return () => {
             if (scriptElement && document.head.contains(scriptElement)) {
                document.head.removeChild(scriptElement);
            }
            if (noscriptElement && document.body.contains(noscriptElement)) {
                document.body.removeChild(noscriptElement);
            }
        }
        
    }, [pathname]);

    return null;
}
