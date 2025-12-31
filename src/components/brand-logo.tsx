

'use client';

import { Component, Briefcase, Building2, Computer, FileText, Folder, Laptop, Paintbrush, Shield, Wrench } from 'lucide-react';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Brand } from '@/lib/types';
import { useEffect, useState, React } from 'react';
import { getBrands } from '@/lib/data';

interface BrandLogoProps {
  brand: string;
  className?: string;
}

const SvgLogo = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 48 48" 
        className={cn("h-full w-full", className)}
        fill="currentColor"
    >
        {children}
    </svg>
)

const LucideIcon = ({ name, className }: { name: string, className?: string }) => {
    const toPascalCase = (str: string) =>
        str.toLowerCase().split(/[-_ ]+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
    
    const IconComponent = (Icons as any)[toPascalCase(name)];

    if (IconComponent) {
        return <IconComponent className={className} />;
    }
    
    return <Component className={className} />;
};


export function BrandLogo({ brand, className }: BrandLogoProps) {
  const [allBrands, setAllBrands] = useState<Brand[]>([]);

  useEffect(() => {
    async function fetchBrands() {
        const brandsData = await getBrands(true);
        setAllBrands(brandsData);
    }
    fetchBrands();
  }, []);

  const predefinedLogos: { [key: string]: React.ReactNode } = {
    Microsoft: (
        <SvgLogo className={className}>
            <g>
                <path fill="#F25022" d="M22.5 22.5H4V4h18.5v18.5z"/>
                <path fill="#7FBA00" d="M44 22.5H25.5V4H44v18.5z"/>
                <path fill="#00A4EF" d="M22.5 44H4V25.5h18.5V44z"/>
                <path fill="#FFB900" d="M44 44H25.5V25.5H44V44z"/>
            </g>
        </SvgLogo>
    ),
    Adobe: (
        <SvgLogo className={className}>
            <g fill="#fa0f00">
                <path d="M29.1 44h8.25L25.35 4H16.5l-12 30h8.25l2.4-6.6h11.7zm-5.4-12.45L26.25 25h-5.1l2.55-6.55z"/>
            </g>
        </SvgLogo>
    ),
    Kaspersky: (
         <SvgLogo className={className}>
            <g fill="#009900">
                <path d="M24 4L6 10v12c0 11.55 7.74 21.75 18 24 10.26-2.25 18-12.45 18-24V10L24 4zm0 22.5h15c-1.2 6.75-5.85 12.3-12 14.25V26.5H9V12.75l15-3.75v17.5z"/>
            </g>
        </SvgLogo>
    ),
    Salesforce: (
        <SvgLogo className={className} fill="#00A1E0">
            <g>
                <path d="M29.61 24.66c-1.39-4.59-3.9-6.3-5.24-6.61-1.07-.26-1.57.74-1.57 1.6 0 1.29.98 2.06 1.63 2.19 1.13.23 2.83.69 3.53 3.32.74 2.76-.11 4.52-2.02 5.5-1.92.98-4.62.77-6.22-1.12s-1.89-4.82-1.15-7.58c.73-2.76 2.83-4.82 5.5-5.5 2.59-.68 5.61-.17 7.52 1.75 1.98 1.98 2.65 4.96 1.95 7.64-.1.39-.54.29-.61-.12l-.07-.48z"/>
                <path d="M24 4a20 20 0 100 40 20 20 0 000-40z"/>
            </g>
        </SvgLogo>
    ),
    MISA: (
        <SvgLogo className={className}>
           <g>
            <path d="M4 4h40v40H4z" fill="#0055A4"/>
            <path d="m14 14 10 10 10-10v20H14V14Z" fill="#fff"/>
           </g>
        </SvgLogo>
    ),
    Bitdefender: (
        <SvgLogo className={className}>
            <g fill="#ED1C24">
                <path d="M24 4 6 10v12c0 11.55 7.74 21.75 18 24 10.26-2.25 18-12.45 18-24V10L24 4zm-4 32-8-8 3-3 5 5 11-11 3 3-14 14z"/>
            </g>
        </SvgLogo>
    ),
    Slack: (
       <SvgLogo className={className} fill="none">
            <g>
                <path d="M12.5 18a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" fill="#36C5F0"/>
                <path d="M14 18a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" fill="#2EB67D"/>
                <path d="M12.5 30a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" fill="#ECB22E"/>
                <path d="M12.5 18a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" transform="rotate(90 18 12.5)" fill="#E01E5A"/>
                <path d="M23.5 18a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" transform="translate(6.5 6.5)" fill="#ECB22E"/>
                <path d="M23.5 18a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" transform="rotate(90 24.5 19)" fill="#36C5F0"/>
                <path d="M23.5 30a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" transform="rotate(90 31 25.5)" fill="#2EB67D"/>
                <path d="M35.5 30a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" fill="#E01E5A"/>
            </g>
       </SvgLogo>
    ),
    MobiSystems: (
        <SvgLogo className={className} fill="#0078d4">
            <g>
                <path d="M12 4h24v8H12zM4 20h30v8H4zM18 36h26v8H18z" />
            </g>
        </SvgLogo>
    ),
    Google: (
       <SvgLogo className={className} fill="none">
            <g>
                <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#4285F4"/>
            </g>
        </SvgLogo>
    ),
    Autodesk: (
      <SvgLogo className={className} fill="#0696D7">
        <g>
            <path d="m24 4-18 8 7 13-7 13 18 8 18-8-7-13 7-13L24 4Zm-2.55 19.5 5.1-1.8 1.8 5.1-5.1 1.8-1.8-5.1Z"/>
        </g>
      </SvgLogo>
    ),
  };
  
  // Priority 1: Check for a predefined SVG logo.
  const BrandComponent = predefinedLogos[brand];
  if (BrandComponent) {
    return BrandComponent;
  }

  // Priority 2: Find the brand in our database and check if it has a custom Lucide icon set.
  const brandData = allBrands.find(b => b.name === brand);
  if (brandData && brandData.icon) {
      return <LucideIcon name={brandData.icon} className={className} />;
  }

  // Fallback: Default icon.
  return <Component className={className} />;
}
