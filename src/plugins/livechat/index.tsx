
'use client';

import { getSiteConfig } from '@/lib/data';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function LivechatScript() {
    const pathname = usePathname();
    const injectedNodesRef = useRef<HTMLElement[]>([]);

    useEffect(() => {
        const loadScript = async () => {
            // First, cleanup any existing scripts/elements from previous renders
            injectedNodesRef.current.forEach(node => {
                if (node.parentElement) {
                    node.parentElement.removeChild(node);
                }
            });
            injectedNodesRef.current = [];

            try {
                const config = await getSiteConfig();
                const livechatConfig = config.plugins?.livechat;

                const isExcluded = livechatConfig?.excludedPages?.some(page => {
                    const trimmedPage = page.trim();
                    if (trimmedPage === '') return false;
                    return pathname.trim().startsWith(trimmedPage);
                }) ?? false;


                if (livechatConfig?.enabled && livechatConfig.script && !isExcluded) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = livechatConfig.script;

                    const nodesToInject = Array.from(tempDiv.childNodes);
                    const newInjectedNodes: HTMLElement[] = [];

                    nodesToInject.forEach(node => {
                        if (node.nodeName === 'SCRIPT') {
                            const oldScript = node as HTMLScriptElement;
                            const newScript = document.createElement('script');
                            
                            // Copy attributes (src, async, defer, etc.)
                            for (let i = 0; i < oldScript.attributes.length; i++) {
                                const attr = oldScript.attributes[i];
                                newScript.setAttribute(attr.name, attr.value);
                            }
                            
                            // Copy inline script content
                            newScript.innerHTML = oldScript.innerHTML;
                            
                            // Append to <head> for better loading practices
                            document.head.appendChild(newScript);
                            newInjectedNodes.push(newScript);
                        } else if (node.nodeType === Node.ELEMENT_NODE) {
                             // Append non-script elements (like the Zalo div) to the body
                            const element = node.cloneNode(true) as HTMLElement;
                            document.body.appendChild(element);
                            newInjectedNodes.push(element);
                        }
                    });
                    
                    injectedNodesRef.current = newInjectedNodes;
                }
            } catch (error) {
                console.error("Failed to load live chat script:", error);
            }
        };

        // Delay execution slightly to ensure the DOM is fully ready
        const timeoutId = setTimeout(loadScript, 100);

        // This is the cleanup function that runs when the component unmounts
        // or before the effect runs again.
        return () => {
             clearTimeout(timeoutId);
             injectedNodesRef.current.forEach(node => {
                if (node.parentElement) {
                    node.parentElement.removeChild(node);
                }
            });
            injectedNodesRef.current = [];
        };
    }, [pathname]); // Re-run the effect when the path changes

    return null;
}
