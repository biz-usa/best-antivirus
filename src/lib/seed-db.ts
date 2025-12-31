

// This is a script to seed your Firestore database with initial data.
// You can run this script from your terminal using `tsx src/lib/seed-db.ts`
// Make sure you have `tsx` installed (`npm install -g tsx`)
// and you are authenticated with Firebase in your environment.

import { db } from './firebase';
import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import type { PageContent } from './types';
import { config } from 'dotenv';
config();


// We temporarily define a SeedPage type because PageContent uses 'id' as slug, 
// but we want to be explicit in the seed data.
interface SeedPage extends Omit<PageContent, 'id' | 'updatedAt'> {
    id: string; // This will be the slug
}

const pagesData: SeedPage[] = [
    {
        id: 'about',
        title: 'V\u1EC1 Saigonsoft.com',
        content: `<h2>S\u1EE9 m\u1EC7nh c\u1EE7a ch\u00FAng t\u00F4i</h2>
<p>T\u1EA1i Saigonsoft.com, ch\u00FAng t\u00F4i tin r\u1EB1ng m\u1ECDi c\u00E1 nh\u00E2n v\u00E0 doanh nghi\u1EC7p \u0111\u1EC1u x\u1EE9ng \u0111\u00E1ng \u0111\u01B0\u1EE3c ti\u1EBFp c\u1EADn nh\u1EEFGng c\u00F4ng c\u1EE5 ph\u1EA7n m\u1EC1m t\u1ED1t nh\u1EA5t \u0111\u1EC3 l\u00E0m vi\u1EC7c v\u00E0 s\u00E1ng t\u1EA1o. S\u1EE9 m\u1EC7nh c\u1EE7a ch\u00FAng t\u00F4i l\u00E0 \u0111\u01A1n gi\u1EA3n h\u00F3a qu\u00E1 tr\u00ECnh t\u00ECm ki\u1EBFm, mua v\u00E0 qu\u1EA3n l\u00FD ph\u1EA7n m\u1EC1m b\u1EA3n quy\u1EC1n, mang l\u1EA1i c\u00E1c gi\u1EA3i ph\u00E1p c\u00F4ng ngh\u1EC7 ch\u00EDnh h\u00E3ng, an to\u00E0n v\u1EDBi chi ph\u00ED h\u1EE3p l\u00FD v\u00E0 d\u1ECBch v\u1EE5 h\u1ED7 tr\u1EE3 v\u01B0\u1EE3t tr\u1ED9i.</p>
<h2>Ph\u01B0\u01A1ng th\u1EE9c giao h\u00E0ng</h2>
<p>T\u1EA5t c\u1EA3 c\u00E1c s\u1EA3n ph\u1EA9m \u0111\u01B0\u1EE3c b\u00E1n tr\u00EAn Saigonsoft.com \u0111\u1EC1u l\u00E0 h\u00E0ng h\u00F3a k\u1EF9 thu\u1EADt s\u1ED1. Sau khi thanh to\u00E1n th\u00E0nh c\u00F4ng, <strong>license key v\u00E0 li\u00EAn k\u1EBFt t\u1EA3i v\u1EC1</strong> s\u1EBD \u0111\u01B0\u1EE3c g\u1EEDi tr\u1EF1c ti\u1EBFp \u0111\u1EBFn \u0111\u1ECBa ch\u1EC9 email c\u1EE7a b\u1EA1n. B\u1EA1n c\u0169ng c\u00F3 th\u1EC3 truy c\u1EADp ch\u00FAng b\u1EA5t c\u1EE9 l\u00FAc n\u00E0o trong m\u1EE5c <a href="/downloads" class="text-primary hover:underline">T\u1EA3i v\u1EC1 & Gi\u1EA5y ph\u00E9p</a> trong t\u00E0i kho\u1EA3n c\u1EE7a m\u00ECnh.</p>
<h2>Gi\u00E1 tr\u1ECB c\u1ED1t l\u00F5i</h2>
<ul>
<li><strong>Ch\u00EDnh h\u00E3ng & Tin c\u1EADy:</strong> Ch\u00FAng t\u00F4i cam k\u1EBFt 100% s\u1EA3n ph\u1EA9m \u0111\u01B0\u1EE3c cung c\u1EA5p \u0111\u1EC1u l\u00E0 ph\u1EA7n m\u1EC1m b\u1EA3n quy\u1EC1n ch\u00EDnh h\u00E3ng.</li>
<li><strong>Chuy\u00EAn m\u00F4n & Kinh nghi\u1EC7m:</strong> \u0110\u1ED9i ng\u0169 chuy\u00EAn gia c\u1EE7a ch\u00FAng t\u00F4i lu\u00F4n s\u1EB5n s\u00E0ng t\u01B0 v\u1EA5n \u0111\u1EC3 b\u1EA1n ch\u1ECDn \u0111\u01B0\u1EE3c gi\u1EA3i ph\u00E1p ph\u1EA7n m\u1EC1m ph\u00F9 h\u1EE3p nh\u1EA5t.</li>
<li><strong>Kh\u00E1ch h\u00E0ng l\u00E0 trung t\u00E2m:</strong> S\u1EF1 h\u00E0i l\u00F2ng c\u1EE7a b\u1EA1n l\u00E0 \u01B0u ti\u00EAn h\u00E0ng \u0111\u1EA7u.</li>
<li><strong>Lu\u00F4n lu\u00F4n \u0111\u1ED5i m\u1EDBi:</strong> Ch\u00FAng t\u00F4i li\u00EAn t\u1EE5c c\u1EADp nh\u1EADt nh\u1EEFGng s\u1EA3n ph\u1EA9m v\u00E0 gi\u1EA3i ph\u00E1p m\u1EDBi nh\u1EA5t.</li>
</ul>`
    },
    {
        id: 'contact',
        title: 'Li\u00EAn h\u1EC7',
        content: `
<h2>V\u0103n ph\u00F2ng H\u1ED3ng K\u00F4ng</h2>
<p><strong>Saigon Enterprise Group HK</strong><br>
\u767E\u5229\u5546\u696D\u4E2D\u5FC3 (Beverley Enterprise Centre)<br>
100 Chatham Rd, Hong Kong</p>
<p>Email: <a href="mailto:hksales@saigonsoft.com" class="text-primary hover:underline">hksales@saigonsoft.com</a><br>
\u0110i\u1EC7n tho\u1EA1i: (+852) 2739 1111</p>

<h2>V\u0103n ph\u00F2ng Vi\u1EC7t Nam</h2>
<p><strong>Saigon Enterprise Group LTD</strong><br>
T\u1EACP \u0110O\u00C0N DOANH NGHI\u1EC6P S\u00C0I G\u00D2N<br>
72 L\u00EA Th\u00E1nh T\u00F4n, Ph\u01B0\u1EDDng B\u1EBFn Ngh\u00E9, Qu\u1EADn 1, Th\u00E0nh ph\u1ED1 H\u1ED3 Ch\u00ED Minh</p>
<p>Email: <a href="mailto:contact@saigonsoft.com" class="text-primary hover:underline">contact@saigonsoft.com</a><br>
\u0110i\u1EC7n tho\u1EA1i: (+84) 28 3822 8899</p>
        `
    },
    {
        id: 'privacy-policy',
        title: 'Ch\u00EDnh s\u00E1ch Quy\u1EC1n ri\u00EAng t\u01B0',
        content: `
<h2>Ch\u00EDnh s\u00E1ch Quy\u1EC1n ri\u00EAng t\u01B0</h2>
<p><em>C\u1EADp nh\u1EADt l\u1EA7n cu\u1ED1i: 25 th\u00E1ng 7 n\u0103m 2024</em></p>
<p>Saigonsoft.com cam k\u1EBFt b\u1EA3o v\u1EC7 quy\u1EC1n ri\u00EAng t\u01B0 c\u1EE7a kh\u00E1ch h\u00E0ng. Ch\u00EDnh s\u00E1ch n\u00E0y m\u00F4 t\u1EA3 c\u00E1ch ch\u00FAng t\u00F4i thu th\u1EADp, s\u1EED d\u1EE5ng v\u00E0 b\u1EA3o v\u1EC7 th\u00F4ng tin c\u00E1 nh\u00E2n c\u1EE7a b\u1EA1n.</p>

<h3>1. Th\u00F4ng tin ch\u00FAng t\u00F4i thu th\u1EADp</h3>
<ul>
<li><strong>Th\u00F4ng tin c\u00E1 nh\u00E2n:</strong> H\u1ECD t\u00EAn, \u0111\u1ECBa ch\u1EC9 email, \u0111\u1ECBa ch\u1EC9 giao h\u00E0ng, s\u1ED1 \u0111i\u1EC7n tho\u1EA1i.</li>
<li><strong>Th\u00F4ng tin giao d\u1ECBch:</strong> Chi ti\u1EBFt \u0111\u01A1n h\u00E0ng, l\u1ECBch s\u1EED mua h\u00E0ng.</li>
<li><strong>D\u1EEF li\u1EC7u k\u1EF9 thu\u1EADt:</strong> \u0110\u1ECBa ch\u1EC9 IP, lo\u1EA1i tr\u00ECnh duy\u1EC7t, h\u1EC7 \u0111i\u1EC1u h\u00E0nh.</li>
</ul>

<h3>2. C\u00E1ch ch\u00FAng t\u00F4i s\u1EED d\u1EE5ng th\u00F4ng tin</h3>
<ul>
<li>X\u1EED l\u00FD \u0111\u01A1n h\u00E0ng v\u00E0 cung c\u1EA5p s\u1EA3n ph\u1EA9m.</li>
<li>G\u1EEDi th\u00F4ng tin c\u1EADp nh\u1EADt v\u1EC1 \u0111\u01A1n h\u00E0ng v\u00E0 c\u00E1c th\u00F4ng b\u00E1o quan tr\u1ECDng.</li>
<li>C\u1EA3i thi\u1EC7n ch\u1EA5t l\u01B0\u1EE3ng s\u1EA3n ph\u1EA9m v\u00E0 d\u1ECBch v\u1EE5.</li>
</ul>
        `
    },
    {
        id: 'refund-policy',
        title: 'Ch\u00EDnh s\u00E1ch \u0110\u1ED5i tr\u1EA3 & Ho\u00E0n ti\u1EC1n',
        content: `
<h2>Ch\u00EDnh s\u00E1ch \u0110\u1ED5i tr\u1EA3 v\u00E0 Ho\u00E0n ti\u1EC1n</h2>
<p><em>C\u1EADp nh\u1EADt l\u1EA7n cu\u1ED1i: 25 th\u00E1ng 7 n\u0103m 2024</em></p>
<p>Do t\u00EDnh ch\u1EA5t c\u1EE7a h\u00E0ng h\u00F3a k\u1EF9 thu\u1EADt s\u1ED1 (ph\u1EA7n m\u1EC1m, license key), ch\u00FAng t\u00F4i c\u00F3 c\u00E1c quy \u0111\u1ECBnh c\u1EE5 th\u1EC3 v\u1EC1 vi\u1EC7c \u0111\u1ED5i tr\u1EA3 v\u00E0 ho\u00E0n ti\u1EC1n \u0111\u1EC3 \u0111\u1EA3m b\u1EA3o quy\u1EC1n l\u1EE3i cho c\u1EA3 kh\u00E1ch h\u00E0ng v\u00E0 nh\u00E0 cung c\u1EA5p.</p>

<h3>1. Tr\u01B0\u1EDDng h\u1EE3p \u0111\u01B0\u1EE3c xem x\u00E9t ho\u00E0n ti\u1EC1n</h3>
<p>Ch\u00FAng t\u00F4i s\u1EBD xem x\u00E9t ho\u00E0n ti\u1EC1n trong c\u00E1c tr\u01B0\u1EDDng h\u1EE3p sau:</p>
<ul>
    <li><strong>S\u1EA3n ph\u1EA9m kh\u00F4ng ho\u1EA1t \u0111\u1ED9ng:</strong> N\u1EBFu license key b\u1EA1n nh\u1EADn \u0111\u01B0\u1EE3c kh\u00F4ng h\u1EE3p l\u1EC7 ho\u1EB7c kh\u00F4ng th\u1EC3 k\u00EDch ho\u1EA1t s\u1EA3n ph\u1EA9m, v\u00E0 \u0111\u1ED9i ng\u0169 h\u1ED7 tr\u1EE3 c\u1EE7a ch\u00FAng t\u00F4i kh\u00F4ng th\u1EC3 kh\u1EAFc ph\u1EE5c s\u1EF1 c\u1ED1 trong v\u00F2ng 48 gi\u1EDD.</li>
    <li><strong>Gửi sai s\u1EA3n ph\u1EA9m:</strong> N\u1EBFu s\u1EA3n ph\u1EA9m b\u1EA1n nh\u1EADn \u0111\u01B0\u1EE3c kh\u00F4ng \u0111\u00FAng v\u1EDBi s\u1EA3n ph\u1EA9m b\u1EA1n \u0111\u00E3 \u0111\u1EB7t h\u00E0ng.</li>
    <li><strong>Giao d\u1ECBch tr\u00F9ng l\u1EB7p:</strong> N\u1EBFu b\u1EA1n v\u00F4 t\u00ECnh b\u1ECB t\u00EDnh ph\u00ED nhi\u1EC1u l\u1EA7n cho c\u00F9ng m\u1ED9t \u0111\u01A1n h\u00E0ng.</li>
</ul>

<h3>2. Tr\u01B0\u1EDDng h\u1EE3p kh\u00F4ng \u00E1p d\u1EE5ng ho\u00E0n ti\u1EC1n</h3>
<p>Ch\u00FAng t\u00F4i kh\u00F4ng th\u1EC3 ho\u00E0n ti\u1EC1n trong c\u00E1c tr\u01B0\u1EDDng h\u1EE3p sau:</p>
<ul>
    <li>B\u1EA1n thay \u0111\u1ED5i \u00FD \u0111\u1ECBnh sau khi \u0111\u00E3 mua h\u00E0ng.</li>
    <li>M\u00E1y t\u00EDnh c\u1EE7a b\u1EA1n kh\u00F4ng \u0111\u00E1p \u1EE9ng y\u00EAu c\u1EA7u h\u1EC7 th\u1ED1ng t\u1ED1i thi\u1EC3u c\u1EE7a s\u1EA3n ph\u1EA9m.</li>
    <li>B\u1EA1n mua nh\u1EA7m s\u1EA3n ph\u1EA9m m\u00E0 kh\u00F4ng tham kh\u1EA3o \u00FD ki\u1EBFn c\u1EE7a ch\u00FAng t\u00F4i.</li>
    <li>License key \u0111\u00E3 \u0111\u01B0\u1EE3c k\u00EDch ho\u1EA1t th\u00E0nh c\u00F4ng.</li>
</ul>

<h3>3. Quy tr\u00ECnh y\u00EAu c\u1EA7u ho\u00E0n ti\u1EC1n</h3>
<p>\u0110\u1EC3 y\u00EAu c\u1EA7u ho\u00E0n ti\u1EC1n, vui l\u00F2ng li\u00EAn h\u1EC7 v\u1EDBi b\u1ED9 ph\u1EADn h\u1ED7 tr\u1EE3 kh\u00E1ch h\u00E0ng c\u1EE7a ch\u00FAng t\u00F4i qua email <a href="mailto:support@saigonsoft.com" class="text-primary hover:underline">support@saigonsoft.com</a> trong v\u00F2ng 7 ng\u00E0y k\u1EC3 t\u1EEB ng\u00E0y mua h\u00E0ng, cung c\u1EA5p m\u00E3 \u0111\u01A1n h\u00E0ng v\u00E0 m\u00F4 t\u1EA3 chi ti\u1EBFt v\u1EA5n \u0111\u1EC1 b\u1EA1n g\u1EB7p ph\u1EA3i.</p>
        `
    },
    {
        id: 'terms-of-use',
        title: '\u0110i\u1EC1u kho\u1EA3n s\u1EED d\u1EE5ng',
        content: `
<h2>\u0110i\u1EC1u kho\u1EA3n s\u1EED d\u1EE5ng</h2>
<p><em>C\u1EADp nh\u1EADt l\u1EA7n cu\u1ED1i: 25 th\u00E1ng 7 n\u0103m 2024</em></p>
<p>Vui l\u00F2ng \u0111\u1ECDc k\u1EF9 c\u00E1c \u0111i\u1EC1u kho\u1EA3n n\u00E0y tr\u01B0\u1EDBc khi s\u1EED d\u1EE5ng trang web Saigonsoft.com.</p>

<h3>1. Ch\u1EA5p nh\u1EADn \u0111i\u1EC1u kho\u1EA3n</h3>
<p>B\u1EB1ng vi\u1EC7c truy c\u1EADp v\u00E0 s\u1EED d\u1EE5ng trang web, b\u1EA1n \u0111\u1ED3ng \u00FD tu\u00E2n th\u1EE7 c\u00E1c \u0111i\u1EC1u kho\u1EA3n v\u00E0 \u0111i\u1EC1u ki\u1EC7n \u0111\u01B0\u1EE3c n\u00EAu t\u1EA1i \u0111\u00E2y.</p>

<h3>2. T\u00E0i kho\u1EA3n ng\u01B0\u1EDDi d\u00F9ng</h3>
<p>B\u1EA1n c\u00F3 tr\u00E1ch nhi\u1EC7m b\u1EA3o m\u1EADt th\u00F4ng tin t\u00E0i kho\u1EA3n v\u00E0 m\u1EADt kh\u1EA9u c\u1EE7a m\u00ECnh. B\u1EA1n \u0111\u1ED3ng \u00FD ch\u1ECBu tr\u00E1ch nhi\u1EC7m cho t\u1EA5t c\u1EA3 c\u00E1c ho\u1EA1t \u0111\u1ED9ng di\u1EC5n ra d\u01B0\u1EDBi t\u00E0i kho\u1EA3n c\u1EE7a b\u1EA1n.</p>

<h3>3. S\u1EDF h\u1EEFu tr\u00ED tu\u1EC7</h3>
<p>T\u1EA5t c\u1EA3 n\u1ED9i dung tr\u00EAn trang web n\u00E0y, bao g\u1ED3m v\u0103n b\u1EA3n, \u0111\u1ED3 h\u1ECDa, logo, l\u00E0 t\u00E0i s\u1EA3n c\u1EE7a Saigonsoft.com ho\u1EB7c c\u00E1c nh\u00E0 cung c\u1EA5p c\u1EE7a ch\u00FAng t\u00F4i v\u00E0 \u0111\u01B0\u1EE3c b\u1EA3o v\u1EC7 b\u1EDFi lu\u1EADt b\u1EA3n quy\u1EC1n.</p>
        `
    },
    {
        id: 'trademarks',
        title: 'Th\u01B0\u01A1ng hi\u1EC7u',
        content: `
<h2>Th\u01B0\u01A1ng hi\u1EC7u</h2>
<p>T\u1EA5t c\u1EA3 c\u00E1c th\u01B0\u01A1ng hi\u1EC7u, nh\u00E3n hi\u1EC7u d\u1ECBch v\u1EE5, \u0111\u1ED3 h\u1ECDa v\u00E0 logo \u0111\u01B0\u1EE3c s\u1EED d\u1EE5ng li\u00EAn quan \u0111\u1EBFn trang web v\u00E0 c\u00E1c d\u1ECBch v\u1EE5 c\u1EE7a ch\u00FAng t\u00F4i l\u00E0 th\u01B0\u01A1ng hi\u1EC7u ho\u1EB7c nh\u00E3n hi\u1EC7u \u0111\u00E3 \u0111\u0103ng k\u00FD c\u1EE7a Saigonsoft.com ho\u1EB7c c\u00E1c b\u00EAn th\u1EE9 ba t\u01B0\u01A1ng \u1EE9ng.</p>
<p>Vi\u1EC7c b\u1EA1n s\u1EED d\u1EE5ng trang web kh\u00F4ng c\u1EA5p cho b\u1EA1n b\u1EA5t k\u1EF3 quy\u1EC1n ho\u1EB7c gi\u1EA5y ph\u00E9p n\u00E0o \u0111\u1EC3 sao ch\u00E9p ho\u1EB7c s\u1EED d\u1EE5ng c\u00E1c th\u01B0\u01A1ng hi\u1EC7u c\u1EE7a Saigonsoft.com ho\u1EB7c c\u00E1c b\u00EAn th\u1EE9 ba.</p>
<p>M\u1ED9t s\u1ED1 th\u01B0\u01A1ng hi\u1EC7u c\u00F3 th\u1EC3 xu\u1EA5t hi\u1EC7n tr\u00EAn trang web c\u1EE7a ch\u00FAng t\u00F4i bao g\u1ED3m:</p>
<ul>
    <li>Microsoft, Windows, Office 365</li>
    <li>Adobe, Photoshop, Creative Cloud</li>
    <li>Kaspersky</li>
    <li>MISA</li>
    <li>Autodesk, AutoCAD</li>
    <li>Google, Google Workspace</li>
    <li>v\u00E0 c\u00E1c th\u01B0\u01A1ng hi\u1EC7u kh\u00E1c...</li>
</ul>
        `
    },
];


async function seedDatabase() {
    const batch = writeBatch(db);

    // Seed Pages
    const pagesCol = collection(db, 'pages');
    console.log(`Seeding ${pagesData.length} pages...`);
    pagesData.forEach(page => {
        const docRef = doc(pagesCol, page.id);
        batch.set(docRef, { 
            title: page.title,
            content: page.content,
            updatedAt: serverTimestamp() 
        });
    });


    try {
        await batch.commit();
        console.log('Static pages seeding finished successfully!');
    } catch (error) {
        console.error('Error committing batch: ', error);
    }
}


seedDatabase();
