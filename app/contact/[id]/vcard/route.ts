import { NextRequest, NextResponse } from 'next/server';
import { ContactInfo } from '@/types/contact';
import { getContact } from '@/lib/storage';

// vCard 생성 함수
function generateVCard(info: ContactInfo): string {
  const toQuotedPrintable = (str: string): string => {
    return str
      .split('')
      .map(char => {
        const code = char.charCodeAt(0);
        if (code >= 32 && code <= 126 && char !== '=' && char !== '?') {
          return char;
        }
        const bytes = new TextEncoder().encode(char);
        return Array.from(bytes)
          .map(byte => '=' + byte.toString(16).toUpperCase().padStart(2, '0'))
          .join('');
      })
      .join('');
  };

  const fullName = `${info.firstName} ${info.lastName}`.trim();
  const hasKorean = (text: string) => /[ᄀ-ᇿ㄰-㆏가-힯]/g.test(text);
  
  let nameField = '';
  let fnField = '';
  
  if (hasKorean(info.lastName || '') || hasKorean(info.firstName || '')) {
    const encodedLastName = toQuotedPrintable(info.lastName || '');
    const encodedFirstName = toQuotedPrintable(info.firstName || '');
    const encodedFullName = toQuotedPrintable(fullName || 'No Name');
    nameField = `N;ENCODING=QUOTED-PRINTABLE:${encodedLastName};${encodedFirstName};;;`;
    fnField = `FN;ENCODING=QUOTED-PRINTABLE:${encodedFullName}`;
  } else {
    nameField = `N:${info.lastName || ''};${info.firstName || ''};;;`;
    fnField = `FN:${fullName || 'No Name'}`;
  }
  
  let orgField = '';
  let titleField = '';
  let adrField = '';
  
  if (info.company) {
    orgField = hasKorean(info.company) 
      ? `ORG;ENCODING=QUOTED-PRINTABLE:${toQuotedPrintable(info.company)}`
      : `ORG:${info.company}`;
  }
  
  if (info.jobTitle) {
    titleField = hasKorean(info.jobTitle)
      ? `TITLE;ENCODING=QUOTED-PRINTABLE:${toQuotedPrintable(info.jobTitle)}`
      : `TITLE:${info.jobTitle}`;
  }
  
  if (info.address) {
    adrField = hasKorean(info.address)
      ? `ADR;TYPE=WORK;ENCODING=QUOTED-PRINTABLE:;;${toQuotedPrintable(info.address)};;;;`
      : `ADR;TYPE=WORK:;;${info.address};;;;`;
  }
  
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    nameField,
    fnField,
    info.phone ? `TEL;TYPE=CELL:${info.phone.replace(/-/g, '')}` : '',
    info.email ? `EMAIL;TYPE=INTERNET:${info.email}` : '',
    orgField,
    titleField,
    info.website ? `URL:${info.website}` : '',
    adrField,
    'END:VCARD',
  ]
    .filter(line => line)
    .join('\r\n');

  return vcard;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    
    // 연락처 데이터 조회
    const contact = await getContact(decodedId);
    
    if (!contact) {
      return NextResponse.json(
        { error: '연락처를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // vCard 생성
    const vCardData = generateVCard(contact);
    const fullName = `${contact.firstName} ${contact.lastName}`.trim();
    
    // vCard 파일로 응답
    return new NextResponse(vCardData, {
      status: 200,
      headers: {
        'Content-Type': 'text/vcard; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fullName)}.vcf"`,
        'Cache-Control': 'public, max-age=3600', // 1시간 캐시
      },
    });
    
  } catch (error) {
    console.error('vCard 생성 오류:', error);
    return NextResponse.json(
      { error: 'vCard 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}